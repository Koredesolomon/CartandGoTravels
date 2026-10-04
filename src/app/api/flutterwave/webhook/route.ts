import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { claimPayment, verifyPayment } from "@/lib/payment";

export function GET() { return NextResponse.json({ ok: true, service: "flutterwave-webhook" }); }
export async function POST(request: NextRequest) {
  const expected = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!expected) return NextResponse.json({ error: "Webhook is unavailable." }, { status: 503 });
  const received = request.headers.get("verif-hash") ?? "";
  const a = Buffer.from(expected), b = Buffer.from(received);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Invalid webhook hash." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  if (payload.event !== "charge.completed" || payload.data?.status !== "successful") return NextResponse.json({ received: true, ignored: true });
  try {
    const payment = await verifyPayment(String(payload.data?.id ?? ""));
    // Webhooks acknowledge payment; only the browser-bound callback can redeem access.
    const first = await claimPayment(payment.id, payment.ref, "verified-webhook");
    return NextResponse.json({ received: true, verified: true, duplicate: !first });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment. Retry this webhook." }, { status: 503 });
  }
}
