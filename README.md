# Cart & Go Travels

Next.js site for Cart & Go Travels: marketing pages, inquiry forms and the paid Consular tools (document pre-assessment and proofreading, CV/cover-letter builder and itinerary planner).

## Getting started

```bash
npm install
cp .env.example .env.local   # then supply your own credentials
npm run dev                  # http://localhost:3000
```

Never commit `.env.local`. Local development is free by default; see [docs/payments.md](docs/payments.md) to test the paid flow.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (prepares the PDF.js worker first) |
| `npm run build` / `npm run start` | Production build and server |
| `npm test` | Node test suite in `tests/` |
| `npm run lint` | ESLint |
| `npm run db:dev` / `npm run db:dev:stop` | Local MySQL for payment testing |
| `npm run evaluate:consular` | Optional live AI regression check (incurs AI usage costs; see [docs/ai-consular-review.md](docs/ai-consular-review.md)) |

Site typography uses `next/font/local` with bundled Poppins, Geist Mono, Inter and Fraunces files in `public/fonts/web/`. Production builds do not download Google Fonts. Include that directory and its font licences when committing/deploying; font sources are listed in its README. The separate Noto Sans files remain used by PDF exports.

## Documentation

- [Consular AI review](docs/ai-consular-review.md): model configuration, review/audit passes, OCR, source verification and partial reports.
- [Proofread background jobs and troubleshooting](docs/proofread-operations.md): async job flow, hosting requirements and diagnosing production failures.
- [Payments and access](docs/payments.md): when payment applies, Flutterwave checkout and payment records.
- [Itinerary planner](docs/itinerary-planner.md): destination catalogue, schedule editing and the visa-support PDF.
- [CV and cover-letter builder](docs/cv-builder.md): forms, country guidance, templates and PDF preview.

## Environment variables

- AI review: `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`). Details in [docs/ai-consular-review.md](docs/ai-consular-review.md).
- Email inquiries: `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`.
- All inquiry forms send their complete submission as a branded PDF attachment to `LEAD_TO_EMAIL`, with a short cover email. The visitor's email remains the reply-to address. PDFs wrap long responses and continue onto additional pages. The bundled Noto Sans font is included in the email route's deployment trace; retain `src/assets/fonts` when deploying from source.
- Production payment and optional local payment testing: `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH`, `FLUTTERWAVE_AMOUNT`, `FLUTTERWAVE_CURRENCY`.
- Set `APP_URL` to the site's canonical origin (HTTPS in production), for example `https://www.cartandgotravels.com` if that is the host used by visitors. Both checkout and callback redirects use this origin; never set it to an internal bind address such as `0.0.0.0:3000`. Apply environment changes and rebuild/restart the production app.
- Generate `PAYMENT_SESSION_SECRET` with `openssl rand -hex 32`. Keep it consistent across instances. Rotating it invalidates existing checkout and access cookies.
- Configure Hostinger MySQL using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. Use the full database and user names displayed by hPanel, including its account prefix. Hostinger normally uses `localhost` and port `3306` for apps hosted on the same server; confirm the host shown for your database. `DB_SSL=true` enables certificate-verified TLS if your database requires it.
- Create a database and user in Websites → Dashboard → Databases → Management. Open phpMyAdmin, select that database, and run `database/payment-redemptions.sql` in the SQL tab. Add the credentials to the Node.js app's environment variables, apply changes, and restart the app. See https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/.
- Local payment testing needs its own MySQL database with the same schema, or explicitly configured remote MySQL access to Hostinger. `localhost` on your Mac does not connect to Hostinger. Keep local and live payment records separate.

To test payments locally with MySQL and Docker Desktop, add the following to the ignored `.env.development.local`. Generate separate passwords with `openssl rand -hex 32`; keep the values consistent when restarting the database:

```dotenv
CONSULAR_PAYMENT_REQUIRED=true
APP_URL=http://localhost:3000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=cartandgo_dev
DB_PASSWORD=<generated-local-password>
DB_NAME=cartandgo_development
DB_SSL=false
LOCAL_MYSQL_ROOT_PASSWORD=<different-generated-local-password>
```

Run `npm run db:dev`, then `npm run dev`. The local database is bound to loopback, creates `payment_redemptions` on its first start, and persists in its own Docker volume. `npm run db:dev:stop` stops it without deleting records. Development loads `.env.development.local` before `.env.local`; it does not use `.env.production`. Production settings stay in `.env.production` or the hosting environment. Use Flutterwave test keys in `.env.development.local` for simulated payments; when `CONSULAR_PAYMENT_REQUIRED=true`, access requires successful payment verification. `PAYMENT_DATABASE_UNAVAILABLE` means checkout could not reach its payment database or table, before requesting a Flutterwave link.

## Deployment

- Run the app as a persistent Node.js process (`next start`). Proofread jobs live in process memory, so serverless or multi-instance hosting must route a session's requests to the same process; a restart loses unfinished jobs. See [docs/proofread-operations.md](docs/proofread-operations.md).
- Allow outbound HTTPS to `api.anthropic.com`, `www.canada.ca`, `www.gov.uk` and `travel.state.gov`, and route execution up to 600 seconds.
- Deploy `public/fonts/`, `src/assets/fonts/` and the PDF.js assets prepared by `predev`/`prebuild` with the app.
- Rebuild and restart after changing code or environment variables.

If a real API credential has ever been placed in an example file, revoke it in the provider account and issue a replacement. Removing it from the file does not revoke it.
