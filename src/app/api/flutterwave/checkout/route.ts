import { NextRequest, NextResponse } from "next/server";
import { CHECKOUT_COOKIE, newCheckoutRef, paymentConfig, PaymentConfigurationError, signToken } from "@/lib/payment";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const reference = newCheckoutRef();
  let stage = "configuration";
  let upstreamStatus: number | undefined;
  try {
    const config = paymentConfig();
    if (request.headers.get("origin") !== config.appUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const ref = newCheckoutRef();
    const signed = signToken("checkout", ref, 3600);
    stage = "flutterwave_request";
    const upstream = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tx_ref: ref, amount: config.amount, currency: config.currency, redirect_url: new URL("/ai-consular-check/payment-callback", config.appUrl).href, customer: { email }, customizations: { title: "CartandGo AI Consular Check" } }),
      signal: AbortSignal.timeout(15000),
    });
    upstreamStatus = upstream.status;
    stage = "flutterwave_response";
    const data = await upstream.json();
    if (!upstream.ok || data.status !== "success" || typeof data.data?.link !== "string") throw new Error("Checkout unavailable");
    const link = new URL(data.data.link);
    if (link.protocol !== "https:" || link.hostname !== "checkout.flutterwave.com") throw new Error("Invalid checkout link");
    const response = NextResponse.json({ url: link.href, amount: config.amount, currency: config.currency });
    response.cookies.set(CHECKOUT_COOKIE, signed, { httpOnly: true, secure: config.appUrl.protocol === "https:", sameSite: "lax", maxAge: 3600, path: "/" });
    return response;
  } catch (error) {
    const code = error instanceof PaymentConfigurationError ? "PAYMENT_CONFIGURATION_INVALID"
      : upstreamStatus === 401 || upstreamStatus === 403 ? "FLUTTERWAVE_AUTH_FAILED"
      : stage === "flutterwave_response" ? "FLUTTERWAVE_CHECKOUT_REJECTED"
      : "PAYMENT_PROVIDER_UNREACHABLE";
    // Log only controlled diagnostics. Never log credentials, request bodies or provider payloads.
    console.error("Payment checkout failed", {
      reference, code, stage, upstreamStatus,
      configurationIssue: error instanceof PaymentConfigurationError ? error.message : undefined,
    });
    return NextResponse.json({ error: "Payment checkout is unavailable. Please try again later.", code, reference }, { status: 503 });
  }
}
