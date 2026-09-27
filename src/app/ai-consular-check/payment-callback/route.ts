import { NextRequest, NextResponse } from "next/server";

type FlutterwaveVerifyResponse = {
  data?: {
    id?: number;
    amount?: number;
    currency?: string;
    status?: string;
    tx_ref?: string;
  };
  message?: string;
};

function getExpectedAmount() {
  const amount = Number(process.env.FLUTTERWAVE_AMOUNT ?? "49.99");
  return Number.isFinite(amount) ? amount : 49.99;
}

function getExpectedCurrency() {
  return (process.env.FLUTTERWAVE_CURRENCY ?? "USD").toUpperCase();
}

async function verifyFlutterwaveTransaction(transactionId: string) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not configured.");
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => null)) as
    | FlutterwaveVerifyResponse
    | null;

  if (!response.ok || !result?.data) {
    throw new Error(result?.message ?? "Flutterwave could not verify this payment.");
  }

  return result.data;
}

function redirectToAiConsular(request: NextRequest, status: "success" | "failed") {
  return NextResponse.redirect(
    new URL(`/ai-consular-check?payment=${status}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const transactionId = request.nextUrl.searchParams.get("transaction_id");
  const status = request.nextUrl.searchParams.get("status");

  if (!transactionId || (status && status.toLowerCase() !== "successful")) {
    return redirectToAiConsular(request, "failed");
  }

  try {
    const verified = await verifyFlutterwaveTransaction(transactionId);
    const expectedAmount = getExpectedAmount();
    const expectedCurrency = getExpectedCurrency();
    const paidAmount = Number(verified.amount ?? 0);
    const paidCurrency = String(verified.currency ?? "").toUpperCase();
    const paidStatus = String(verified.status ?? "").toLowerCase();

    if (
      paidStatus !== "successful" ||
      paidCurrency !== expectedCurrency ||
      paidAmount < expectedAmount
    ) {
      return redirectToAiConsular(request, "failed");
    }

    const response = redirectToAiConsular(request, "success");
    response.cookies.set("ai_consular_unlocked", transactionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return redirectToAiConsular(request, "failed");
  }
}
