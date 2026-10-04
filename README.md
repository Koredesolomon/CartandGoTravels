This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Service configuration

Copy `.env.example` to `.env.local` and supply your own credentials. Never commit `.env.local`.

- Email inquiries: `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`.
- AI review: `ANTHROPIC_API_KEY` and a model available to your Anthropic account in `ANTHROPIC_MODEL`.
- Paid access: `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH`, `FLUTTERWAVE_AMOUNT`, `FLUTTERWAVE_CURRENCY`.
- Set `APP_URL` to the site's canonical origin (HTTPS in production).
- Generate `PAYMENT_SESSION_SECRET` with `openssl rand -hex 32`. Keep it consistent across instances. Rotating it invalidates existing checkout and access cookies.
- Configure a durable Upstash Redis database with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Do not expire or evict `cartandgo:consumed-payment:*` records: they prevent payment reuse across instances and restarts. Checkout fails closed when required configuration is missing.

Checkout uses Flutterwave Standard and returns to `/ai-consular-check/payment-callback`. Configure the Flutterwave webhook as `/api/flutterwave/webhook` with the secret hash above. A payment unlocks a signed one-hour session only in the browser that started checkout. The AI endpoint independently verifies that session. Webhook delivery does not grant access.

TXT, DOCX and text-based PDF files are extracted in the browser (10MB, 100 PDF pages, and 12,000 extracted characters maximum). Scanned or password-protected PDFs require pasted text instead. `predev` and `prebuild` copy the PDF worker and supporting font/CMap/WASM assets from the installed PDF.js package; deploy these generated public assets with the app.

If a real API credential has ever been placed in an example file, revoke it in the provider account and issue a replacement. Removing it from the file does not revoke it.
