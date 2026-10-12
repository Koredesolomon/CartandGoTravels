# Payments and access

## When payment is required

Consular always requires payment when `NODE_ENV=production`, including `npm run start`. The page, AI review, scanned-document reading, background job polling and itinerary exports require a signed, unexpired paid session; a previous `CONSULAR_PAYMENT_REQUIRED=false` setting cannot disable production payment. Local development with `npm run dev` is free by default: leave `CONSULAR_PAYMENT_REQUIRED` unset or set it to `false`. Local free mode rejects checkout attempts and uses a random HttpOnly browser-session cookie to keep background jobs private, with the existing request/concurrency limits. Free local use does not require Flutterwave credentials, MySQL or `PAYMENT_SESSION_SECRET`. Set `CONSULAR_PAYMENT_REQUIRED=true` only to test the paid flow locally. Existing payment records and callback/webhook verification remain intact. Rebuild/redeploy and restart the production app to apply this change.

## Checkout flow

Checkout uses Flutterwave Standard in a separate tab and returns to `/ai-consular-check/payment-callback`. After verifying and redeeming the bound transaction, the callback redirects to the unlocked `/ai-consular-check?payment=success` page with “Payment Successful, you can close tab and return to Consular page”. The original Consular tab rechecks its signed session when notified by the return tab or when the user focuses it, then unlocks without refreshing or clearing inputs. Notifications and query parameters cannot grant access. Configure the Flutterwave webhook as `/api/flutterwave/webhook` with the secret hash above. A payment unlocks a signed one-hour session only in the browser that started checkout. The AI endpoint independently verifies that session. Webhook delivery does not grant access.

## Payment records

- The `payment_redemptions` table records consumed transactions and verified webhook deliveries independently. Preserve it across deployments; deleting records permits payment reuse. Checkout checks the database and table before creating a Flutterwave payment link. Upstash settings are no longer used.
