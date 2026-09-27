import { NextRequest, NextResponse } from "next/server";

type FlutterwaveWebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    status?: string;
    amount?: number;
    currency?: string;
    tx_ref?: string;
  };
};

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

const verifiedWebhookTransactions = new Set<string>();

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "flutterwave-webhook",
  });
}

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

export async function POST(request: NextRequest) {
  const configuredHash = process.env.FLUTTERWAVE_SECRET_HASH;

  if (!configuredHash) {
    return NextResponse.json(
      { error: "FLUTTERWAVE_SECRET_HASH is not configured." },
      { status: 503 },
    );
  }

  const receivedHash = request.headers.get("verif-hash");

  if (!receivedHash || receivedHash !== configuredHash) {
    return NextResponse.json({ error: "Invalid webhook hash." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | FlutterwaveWebhookPayload
    | null;
  const transactionId = String(payload?.data?.id ?? "").trim();

  if (!transactionId) {
    return NextResponse.json({ received: true });
  }

  if (verifiedWebhookTransactions.has(transactionId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const event = String(payload?.event ?? "").toLowerCase();
  const payloadStatus = String(payload?.data?.status ?? "").toLowerCase();

  if (!event.includes("charge") && !event.includes("transfer")) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (payloadStatus && payloadStatus !== "successful") {
    return NextResponse.json({ received: true, ignored: true });
  }

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
    return NextResponse.json({ received: true, ignored: true });
  }

  verifiedWebhookTransactions.add(transactionId);

  return NextResponse.json({
    received: true,
    verified: true,
    transaction: {
      id: verified.id,
      txRef: verified.tx_ref,
      amount: paidAmount,
      currency: paidCurrency,
    },
  });
}
