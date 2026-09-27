import { NextRequest, NextResponse } from "next/server";

type FlutterwaveVerifyResponse = {
  status?: string;
  message?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    amount?: number;
    currency?: string;
    status?: string;
    customer?: {
      email?: string;
    };
  };
};

const verifiedTransactions = new Set<string>();

function getExpectedAmount() {
  const amount = Number(process.env.FLUTTERWAVE_AMOUNT ?? "49.99");
  return Number.isFinite(amount) ? amount : 49.99;
}

function getExpectedCurrency() {
  return (process.env.FLUTTERWAVE_CURRENCY ?? "USD").toUpperCase();
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: "FLUTTERWAVE_SECRET_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    transactionId?: unknown;
  } | null;
  const transactionId = String(body?.transactionId ?? "").trim();

  if (!transactionId) {
    return NextResponse.json(
      { error: "A Flutterwave transaction ID is required." },
      { status: 400 },
    );
  }

  if (verifiedTransactions.has(transactionId)) {
    return NextResponse.json(
      { error: "This transaction has already been used to unlock a session." },
      { status: 409 },
    );
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
    return NextResponse.json(
      { error: result?.message ?? "Flutterwave could not verify this payment." },
      { status: 400 },
    );
  }

  const expectedAmount = getExpectedAmount();
  const expectedCurrency = getExpectedCurrency();
  const paidAmount = Number(result.data.amount ?? 0);
  const paidCurrency = String(result.data.currency ?? "").toUpperCase();
  const paidStatus = String(result.data.status ?? "").toLowerCase();

  if (paidStatus !== "successful") {
    return NextResponse.json(
      { error: "Payment was not successful." },
      { status: 402 },
    );
  }

  if (paidCurrency !== expectedCurrency) {
    return NextResponse.json(
      { error: `Payment currency must be ${expectedCurrency}.` },
      { status: 400 },
    );
  }

  if (paidAmount < expectedAmount) {
    return NextResponse.json(
      { error: `Payment amount must be at least ${expectedAmount} ${expectedCurrency}.` },
      { status: 400 },
    );
  }

  verifiedTransactions.add(transactionId);

  return NextResponse.json({
    verified: true,
    transaction: {
      id: result.data.id,
      txRef: result.data.tx_ref,
      flwRef: result.data.flw_ref,
      amount: paidAmount,
      currency: paidCurrency,
      customerEmail: result.data.customer?.email,
    },
  });
}
