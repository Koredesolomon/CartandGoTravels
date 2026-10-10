import { randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, readToken } from "@/lib/payment";

export const CONSULAR_SESSION_COOKIE = "ai_consular_session";
type ConsularAccess = { ref: string; newSession?: string; secure?: boolean };

export function isConsularPaymentRequired() {
  // Production always requires payment, including hosts with the old free-mode
  // setting. Local development is free unless explicitly testing paid access.
  return process.env.NODE_ENV === "production" || process.env.CONSULAR_PAYMENT_REQUIRED === "true";
}

export function getConsularAccessRef(cookie: string | undefined): string | null {
  return readToken(cookie, "access")?.ref || null;
}

export function getConsularRequestAccess(request: NextRequest, createSession = true): ConsularAccess | null {
  if (isConsularPaymentRequired()) {
    const ref = getConsularAccessRef(request.cookies.get(ACCESS_COOKIE)?.value);
    return ref ? { ref } : null;
  }
  const session = request.cookies.get(CONSULAR_SESSION_COOKIE)?.value;
  if (session && /^[a-f0-9]{64}$/.test(session)) return { ref: `free-${session}` };
  if (!createSession) return null;
  const newSession = randomBytes(32).toString("hex");
  return { ref: `free-${newSession}`, newSession, secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:" };
}

// Anonymous visitors still have distinct private job owners. This cookie grants
// no paid access and does not require Flutterwave, MySQL or a payment secret.
export function withConsularSession(response: NextResponse, access: ConsularAccess) {
  if (access.newSession) response.cookies.set(CONSULAR_SESSION_COOKIE, access.newSession, { httpOnly: true, secure: access.secure, sameSite: "lax", maxAge: 86400, path: "/" });
  return response;
}
