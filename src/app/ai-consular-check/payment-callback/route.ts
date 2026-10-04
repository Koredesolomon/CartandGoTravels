import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_SECONDS, CHECKOUT_COOKIE, claimPayment, readToken, signToken, verifyPayment } from "@/lib/payment";

export async function GET(request: NextRequest) {
  const failed = () => NextResponse.redirect(new URL("/ai-consular-check?payment=failed", request.url));
  const checkout = readToken(request.cookies.get(CHECKOUT_COOKIE)?.value, "checkout");
  const id = request.nextUrl.searchParams.get("transaction_id");
  if (!checkout || !id || request.nextUrl.searchParams.get("status") !== "successful") return failed();
  try {
    const payment = await verifyPayment(id);
    if (payment.ref !== checkout.ref) return failed();
    const signed = signToken("access", payment.ref);
    if (!await claimPayment(payment.id, payment.ref)) return failed();
    const response = NextResponse.redirect(new URL("/ai-consular-check?payment=success", request.url));
    response.cookies.set(ACCESS_COOKIE, signed, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: ACCESS_SECONDS, path: "/" });
    response.cookies.delete(CHECKOUT_COOKIE);
    response.cookies.delete("ai_consular_unlocked");
    return response;
  } catch { return failed(); }
}
