import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "ai_consular_access";
export const CHECKOUT_COOKIE = "ai_consular_checkout";
export const ACCESS_SECONDS = 3600;

export class PaymentConfigurationError extends Error {}

type Token = { purpose: "checkout" | "access"; ref: string; expires: number };
function secret() {
  const value = process.env.PAYMENT_SESSION_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-with-")) throw new PaymentConfigurationError("PAYMENT_SESSION_SECRET is missing, too short, or still a placeholder.");
  return value;
}
export function signToken(purpose: Token["purpose"], ref: string, seconds = ACCESS_SECONDS) {
  const body = Buffer.from(JSON.stringify({ purpose, ref, expires: Date.now() + seconds * 1000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function readToken(value: string | undefined, purpose: Token["purpose"]): Token | null {
  try {
    if (!value || value.length > 2048) return null;
    const [body, signature, extra] = value.split(".");
    if (!body || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(body).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const token = JSON.parse(Buffer.from(body, "base64url").toString()) as Token;
    return token.purpose === purpose && typeof token.ref === "string" && Number.isFinite(token.expires) && token.expires > Date.now() ? token : null;
  } catch { return null; }
}
export function paymentConfig() {
  secret();
  const amount = Number(process.env.FLUTTERWAVE_AMOUNT ?? "49.99");
  const currency = (process.env.FLUTTERWAVE_CURRENCY ?? "USD").toUpperCase();
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const missing = [!key && "FLUTTERWAVE_SECRET_KEY", !url && "UPSTASH_REDIS_REST_URL", !token && "UPSTASH_REDIS_REST_TOKEN"].filter(Boolean);
  if (missing.length) throw new PaymentConfigurationError(`Missing environment variables: ${missing.join(", ")}.`);
  if (!Number.isFinite(amount) || amount <= 0) throw new PaymentConfigurationError("FLUTTERWAVE_AMOUNT must be a positive number.");
  if (!/^[A-Z]{3}$/.test(currency)) throw new PaymentConfigurationError("FLUTTERWAVE_CURRENCY must be a three-letter currency code.");
  let appUrl: URL;
  try { appUrl = new URL(process.env.APP_URL ?? "http://localhost:3000"); }
  catch { throw new PaymentConfigurationError("APP_URL must be a valid absolute URL."); }
  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") throw new PaymentConfigurationError("APP_URL must use HTTPS in production.");
  if (appUrl.username || appUrl.password || appUrl.pathname !== "/" || appUrl.search || appUrl.hash) throw new PaymentConfigurationError("APP_URL must contain only the website origin, without credentials, a path, or query parameters.");
  return { amount, currency, key: key!, url: url!, token: token!, appUrl };
}
export function newCheckoutRef() { return `cartandgo-${randomUUID()}`; }
export async function verifyPayment(transactionId: string) {
  if (!/^\d+$/.test(transactionId)) throw new Error("Invalid transaction ID.");
  const config = paymentConfig();
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${config.key}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  const data = result?.data;
  if (!response.ok || result.status !== "success" || !data || String(data.id) !== transactionId || data.status !== "successful" || data.currency !== config.currency || !Number.isFinite(Number(data.amount)) || Number(data.amount) < config.amount || typeof data.tx_ref !== "string") throw new Error("Payment could not be verified.");
  return { id: transactionId, ref: data.tx_ref as string };
}
// SET NX is atomic across concurrent requests and deployments. Do not expire consumed payment IDs.
export async function claimPayment(transactionId: string, ref: string, namespace: "consumed-payment" | "verified-webhook" = "consumed-payment") {
  const config = paymentConfig();
  const response = await fetch(config.url, {
    method: "POST", headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", `cartandgo:${namespace}:${transactionId}`, ref, "NX"]),
    cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error("Payment storage is unavailable.");
  return data.result === "OK";
}
