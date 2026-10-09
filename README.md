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

The AI Consular itinerary planner uses a destination/city attraction catalogue in `src/data/itineraryDestinations.ts`, with official visitor-information links and estimated visit lengths. It supports multi-city routes, interest filters, custom cities/places, editable schedules, text copies and an unbranded Flight & Accommodation Itinerary PDF using the four-section visa-support template. PDF download requires full name, passport number, visa category, home-country tie/evidence, financial evidence, dated inbound/outbound flight references and actual reservation statuses, plus accommodation details for every city stop. Required supporting uploads cover the passport bio-data page, both flights, each city stop's accommodation, home-country tie and financial means. PDF/JPG/PNG files are limited to 5 MB each and 30 MB total; unreadable PDFs/images and missing uploads are rejected server-side. Originals are embedded as file attachments in the PDF; readers need attachment support to open them. The tool reports applicant-provided booking statuses and does not independently certify reservations. `/api/itinerary-pdf` requires consular access, validates the edited schedule and documents, returns a private/no-store attachment, and does not save or email identity details or uploads. Keep the traced Noto Sans font in deployments. Known museum hours/closures are dated snapshots; refresh them from their linked venue sources when maintaining the catalogue. Other opening hours, transport durations and bookings must be checked by the traveler. Scheduling and export are covered by `tests/itinerary*.test.cjs`. Drafts and selected files stay in memory across tool tabs and clear on page exit. Changing route/date/accommodation details and rebuilding also resets the document form so old proofs cannot be assigned to new stops.

Copy `.env.example` to `.env.local` and supply your own credentials. Never commit `.env.local`.

AI Consular tools require a signed, unexpired paid session in every environment, including local development. Development payment bypasses have been removed. Existing verified payment sessions remain valid until expiry; the page, AI review, scanned-document reading, access verification and itinerary export all enforce the same paid-session check.

- Email inquiries: `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`.
- All inquiry forms send their complete submission as a branded PDF attachment to `LEAD_TO_EMAIL`, with a short cover email. The visitor's email remains the reply-to address. PDFs wrap long responses and continue onto additional pages. The bundled Noto Sans font is included in the email route's deployment trace; retain `src/assets/fonts` when deploying from source.
- AI review: `ANTHROPIC_API_KEY` and a model that supports Anthropic JSON structured outputs in `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`). Each pre-assessment normally makes two AI calls: document review/proofreading, then a verification pass against the same source material. Invalid evidence or structure gets one bounded repair attempt; a report is issued only after validation succeeds. Model/provider failures, incomplete responses and invalid evidence return an error without a keyword fallback or fabricated score. Proofreading corrections that change detected numeric/date/currency facts, negations or commitment wording are withheld with an explicit limitation; this conservative guard is not a semantic guarantee. Reports show document types, criterion reasons, checked quotations, proofreading suggestions, missing evidence and clarification questions. Document evidence and official citations select passage IDs whose exact quotations are resolved by the server; fabricated IDs and document mismatches are rejected. Full document text still reaches both AI passes, and proofreading originals are checked against it, so source quotations cannot be silently rewritten; this does not establish document authenticity or guarantee correct AI reasoning. Scoring measures weighted supplied-evidence coverage, not approval likelihood; it is withheld for unresolved risk findings, unassessable criteria, unrelated/uncertain documents or unverified official guidance. Current official pages are fetched without applicant data for Canada, the UK and the US; other destinations receive limited text/evidence review. Sources are not a complete local visa-office checklist. Allow outbound HTTPS to `api.anthropic.com`, `www.canada.ca`, `www.gov.uk` and `travel.state.gov`, and assessment route execution up to 600 seconds (240 seconds per AI pass, with a 550-second overall deadline). Reports cut off by the provider output limit are regenerated once with a larger output allowance, using a shared retry budget across all passes and the same overall deadline. Failed reports return distinct `review_incomplete`, `report_validation_failed` or `review_failed` codes and a request reference that matches the server log, without logging applicant text. Assessment timeouts return a distinct `504 review_timeout` response while keeping uploaded text available for retry. Source failures are shown in the report and withhold the score. Synthetic/API regression coverage is in `tests/consular-review.test.cjs`; mocked tests verify behavior, not a guarantee of visa-review accuracy. With the local app running and `CONSULAR_EVAL_ACCESS_TOKEN` set to the `ai_consular_access` cookie value from a valid paid session, `npm run evaluate:consular` submits only the synthetic fixture in `tests/fixtures/consular/conflicting-evidence.json` and checks salary/date contradictions, a grammar correction, missing financial evidence and exact quotations. To validate an existing saved report without provider calls, use `npm run evaluate:consular -- --report <path>`. This optional live evaluation normally makes two provider calls (up to four if report repair and output-limit recovery are needed) and incurs normal AI usage costs; it is one regression case, not a calibrated accuracy benchmark.
- Paid access: `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH`, `FLUTTERWAVE_AMOUNT`, `FLUTTERWAVE_CURRENCY`.
- Set `APP_URL` to the site's canonical origin (HTTPS in production), for example `https://www.cartandgotravels.com` if that is the host used by visitors. Both checkout and callback redirects use this origin; never set it to an internal bind address such as `0.0.0.0:3000`. Apply environment changes and rebuild/restart the production app.
- Generate `PAYMENT_SESSION_SECRET` with `openssl rand -hex 32`. Keep it consistent across instances. Rotating it invalidates existing checkout and access cookies.
- Configure Hostinger MySQL using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. Use the full database and user names displayed by hPanel, including its account prefix. Hostinger normally uses `localhost` and port `3306` for apps hosted on the same server; confirm the host shown for your database. `DB_SSL=true` enables certificate-verified TLS if your database requires it.
- Create a database and user in Websites → Dashboard → Databases → Management. Open phpMyAdmin, select that database, and run `database/payment-redemptions.sql` in the SQL tab. Add the credentials to the Node.js app's environment variables, apply changes, and restart the app. See https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/.
- The `payment_redemptions` table records consumed transactions and verified webhook deliveries independently. Preserve it across deployments; deleting records permits payment reuse. Checkout checks the database and table before creating a Flutterwave payment link. Upstash settings are no longer used.
- Local development needs its own MySQL database with the same schema, or explicitly configured remote MySQL access to Hostinger. `localhost` on your Mac does not connect to Hostinger. Keep local and live payment records separate.

For local MySQL with Docker Desktop, add the following to the ignored `.env.development.local`. Generate separate passwords with `openssl rand -hex 32`; keep the values consistent when restarting the database:

```dotenv
APP_URL=http://localhost:3000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=cartandgo_dev
DB_PASSWORD=<generated-local-password>
DB_NAME=cartandgo_development
DB_SSL=false
LOCAL_MYSQL_ROOT_PASSWORD=<different-generated-local-password>
```

Run `npm run db:dev`, then `npm run dev`. The local database is bound to loopback, creates `payment_redemptions` on its first start, and persists in its own Docker volume. `npm run db:dev:stop` stops it without deleting records. Development loads `.env.development.local` before `.env.local`; it does not use `.env.production`. Production settings stay in `.env.production` or the hosting environment. Use Flutterwave test keys in `.env.development.local` for simulated payments; access still requires successful payment verification. `PAYMENT_DATABASE_UNAVAILABLE` means checkout could not reach its payment database or table, before requesting a Flutterwave link.

Checkout uses Flutterwave Standard and returns to `/ai-consular-check/payment-callback`. Configure the Flutterwave webhook as `/api/flutterwave/webhook` with the secret hash above. A payment unlocks a signed one-hour session only in the browser that started checkout. The AI endpoint independently verifies that session. Webhook delivery does not grant access.

Pre-assessment starts with document selection. Selecting PDF, DOCX or TXT files validates only file metadata and keeps them in page memory; no text is read and no OCR or review request is sent until the user clicks **Proofread**. After that click, readable text is processed internally; PDFs containing images use the paid/development-protected `/api/document-ocr` endpoint. Every physical page must be accounted for. Truly unreadable document pages and truncated responses are rejected; pages containing only a signature in a signing area receive an explicit unverified-signature annotation instead of blocking readable document pages. Legible handwriting is transcribed, unclear fields remain marked, and signature/handwriting reading notes reach both review passes and appear in report limitations. Signature marks are not authenticated or used to infer a signer; reading annotations are excluded from proofreading corrections. AI-read scans receive a limited report without a readiness score because transcription has not been independently confirmed. The page shows filenames followed by the assessment results, with no extracted-text preview or confirmation step. Paste text remains an alternative. Limits remain six files, 10MB each, 30MB total, 100 pages per PDF and 60,000 characters total. Files and text stay in page memory and are not saved by these routes. Replacing input or switching input mode cancels pending processing and ignores stale results. CV and cover-letter uploads still use browser text extraction with their 12,000-character limit. `predev` and `prebuild` copy the PDF worker and font/CMap/WASM assets from the installed PDF.js package; deploy these public assets with the app. The worker is served at `/pdf.worker.min.js` with a JavaScript content type for module-worker compatibility.

CV and cover-letter scratch results provide PDF download buttons after generation. The CV builder supports separate Job CV / Résumé and Academic CV forms, with contact details, repeatable education and employment, skills, languages, projects, certifications, awards, training, memberships, volunteering and reference preferences. Academic forms also cover thesis/supervisor details, research and teaching appointments, publications with publication status, presentations, grants, academic service and patents. Core contact/profile/education fields are validated; optional sections may be left blank, so applicants without employment or publications can still build a draft. Incomplete added entries and reversed dates block generation. Drafts retain applicant-entered facts and order dated entries most recent first.

Country profiles provide linked official guidance, location/language hints, reference guidance and optional work-authorisation fields where applicable. Job guidance is available for Canada, the US, UK, Germany, Ireland, Australia and New Zealand; other European profiles use general Europass guidance. Destinations without verified country guidance explicitly use an international template. Academic guidance also draws on Oxford's academic-application guidance; employer/university instructions always take priority. Canada and US exports use Letter paper; other exports use A4. Changing details, country or CV type clears the previous draft and download. Downloading exports the actual draft, including all completed sections, rather than optimisation notes. PDF generation runs in the browser, preserves multiline text across pages, and uses the bundled Noto Sans font in `public/fonts/` (including its OFL licence). Deploy this directory with the app. CV validation, country adaptation and export are covered by `tests/cv-builder.test.cjs` and `tests/application-document-pdf.test.cjs`.

Scratch CVs offer five original single-column templates: Classic, Modern, Minimal, Executive and Scholarly. The visual template-picker approach takes inspiration from [CV Engineer](https://www.cvengineer.com/); its assets and example content are not bundled. Templates change the header, section rules, colours, typography and spacing while preserving all entered Job or Academic CV sections. Switching template updates the preview and download without rebuilding or clearing applicant details. The preview renders the generated PDF with PDF.js and supports navigating every page; the download uses those same PDF bytes. Text remains available in the expandable CV-text view. Fonts and the PDF rendering libraries load on demand; retain both `public/fonts/NotoSans-Regular.ttf` and `public/fonts/NotoSans-Bold.ttf`, their OFL licence, and the prepared PDF.js worker when deploying. No ATS certification or universal page-length compliance is claimed. The export tests check distinct layouts, full Unicode content and multi-page wrapping for every template in both paper sizes.

CV preview attempts create a fresh PDF worker with a 15-second startup limit, so a temporary worker-download failure cannot poison subsequent retries. Failed previews keep the prepared PDF available to download; retrying preserves the draft. Pending startup is cancelled on template changes and page exit, and loaded documents are destroyed before their worker is released. Worker retry, cancellation and unresponsive-startup cases are covered by `tests/cv-preview-worker.test.cjs`.

If a real API credential has ever been placed in an example file, revoke it in the provider account and issue a replacement. Removing it from the file does not revoke it.
