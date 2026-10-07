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

The AI Consular itinerary planner uses a destination/city attraction catalogue in `src/data/itineraryDestinations.ts`, with official visitor-information links and estimated visit lengths. It supports multi-city routes, interest filters, custom cities/places, editable schedules, text copies and an unbranded Flight & Accommodation Itinerary PDF using the four-section visa-support template. PDF download requires full name, passport number, visa category, home-country tie/evidence, financial evidence, dated inbound/outbound flight references and actual reservation statuses, plus accommodation details for every city stop. Required supporting uploads cover the passport bio-data page, both flights, each city stop's accommodation, home-country tie and financial means. PDF/JPG/PNG files are limited to 5 MB each and 30 MB total; unreadable PDFs/images and missing uploads are rejected server-side. Originals are embedded as file attachments in the PDF; readers need attachment support to open them. The tool reports applicant-provided booking statuses and does not independently certify reservations. `/api/itinerary-pdf` requires consular access, validates the edited schedule and documents, returns a private/no-store attachment, and does not save or email identity details or uploads. Keep the traced Noto Sans font in deployments. Known museum hours/closures are dated snapshots; refresh them from their linked venue sources when maintaining the catalogue. Other opening hours, transport durations and bookings must be checked by the traveler. Scheduling and export are covered by `tests/itinerary*.test.cjs`. Drafts and selected files stay in memory across tool tabs and clear on page exit or session wipe. Changing route/date/accommodation details and rebuilding also resets the document form so old proofs cannot be assigned to new stops.

Copy `.env.example` to `.env.local` and supply your own credentials. Never commit `.env.local`.

- Email inquiries: `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`.
- All inquiry forms send their complete submission as a branded PDF attachment to `LEAD_TO_EMAIL`, with a short cover email. The visitor's email remains the reply-to address. PDFs wrap long responses and continue onto additional pages. The bundled Noto Sans font is included in the email route's deployment trace; retain `src/assets/fonts` when deploying from source.
- AI review: `ANTHROPIC_API_KEY` and a model available to your Anthropic account in `ANTHROPIC_MODEL`.
- Paid access: `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH`, `FLUTTERWAVE_AMOUNT`, `FLUTTERWAVE_CURRENCY`.
- Set `APP_URL` to the site's canonical origin (HTTPS in production), for example `https://www.cartandgotravels.com` if that is the host used by visitors. Both checkout and callback redirects use this origin; never set it to an internal bind address such as `0.0.0.0:3000`. Apply environment changes and rebuild/restart the production app.
- Generate `PAYMENT_SESSION_SECRET` with `openssl rand -hex 32`. Keep it consistent across instances. Rotating it invalidates existing checkout and access cookies.
- Configure Hostinger MySQL using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. Use the full database and user names displayed by hPanel, including its account prefix. Hostinger normally uses `localhost` and port `3306` for apps hosted on the same server; confirm the host shown for your database. `DB_SSL=true` enables certificate-verified TLS if your database requires it.
- Create a database and user in Websites → Dashboard → Databases → Management. Open phpMyAdmin, select that database, and run `database/payment-redemptions.sql` in the SQL tab. Add the credentials to the Node.js app's environment variables, apply changes, and restart the app. See https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/.
- The `payment_redemptions` table records consumed transactions and verified webhook deliveries independently. Preserve it across deployments; deleting records permits payment reuse. Checkout checks the database and table before creating a Flutterwave payment link. Upstash settings are no longer used.
- Local development needs its own MySQL database with the same schema, or explicitly configured remote MySQL access to Hostinger. `localhost` on your Mac does not connect to Hostinger. Keep local and live payment records separate.

Checkout uses Flutterwave Standard and returns to `/ai-consular-check/payment-callback`. Configure the Flutterwave webhook as `/api/flutterwave/webhook` with the secret hash above. A payment unlocks a signed one-hour session only in the browser that started checkout. The AI endpoint independently verifies that session. Webhook delivery does not grant access.

TXT, DOCX and text-based PDF files are extracted in the browser (10MB, 100 PDF pages, and 12,000 extracted characters maximum). Scanned or password-protected PDFs require pasted text instead. `predev` and `prebuild` copy the PDF worker and supporting font/CMap/WASM assets from the installed PDF.js package; deploy these generated public assets with the app. The worker is served at `/pdf.worker.min.js` with a JavaScript content type because some hosts serve `.mjs` as `text/plain`, which browsers reject for module workers.

If a real API credential has ever been placed in an example file, revoke it in the provider account and issue a replacement. Removing it from the file does not revoke it.
