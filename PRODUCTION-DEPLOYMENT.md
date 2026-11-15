# Production deployment preparation

## Readiness summary

This repository is configured as a Next.js application and is suitable for Vercel's automatic framework detection, but it is **not cleared for production deployment**. Deployment was not performed. The S3-compatible private-storage adapter and direct-upload flow are implemented; a provider, bucket, credentials, CORS policy, existing-file transfer, and staging verification still need operator configuration.

- Set the production domain and all environment variables listed below. No production domain, verified email sender, live payment key, DNS, or HTTPS status has been supplied or verified.
- Configure database backups and monitoring with the selected providers; neither is confirmed by this repository.
- The coupon schema migration is now represented in source and must be deployed and verified against a clean/staging database before production. The coupon-usage migration also needs to be applied to any target database.
- Automated tests are not configured. A manual role, checkout, webhook, download, email, refund-request, and payout smoke test is still required in staging.
- Refund requests can be recorded by buyers, but this repository has no staff refund-review screen or Paystack refund-initiation workflow. Do not launch while representing refunds as end-to-end self-service; establish and test an operational review and reversal process first.

## Platform and runtime

- Vercel is the default deployment target; no `vercel.json` or custom output configuration is required. Do not add one unless a platform-specific requirement arises.
- Install: `npm ci`
- Build: `npm run build` (regenerates Prisma Client from the current schema before compiling Next.js).
- Framework output: Next.js `.next` output, managed by Vercel/Next.js.
- Node.js: `>=20.9.0`, matching the installed Next.js 16 engine requirement.
- Apply schema changes with `npm run db:deploy` (`prisma migrate deploy`). `npm run db:migrate` runs `prisma migrate dev` and is for development only.
- Do not run `prisma migrate reset` against a shared, staging, or production database. Review migrations and take a provider backup before production schema changes.
- There is no middleware, Server Actions directory, cron endpoint, or scheduled worker in the current source. Rate limits use PostgreSQL rows, so they are shared across application instances as long as all instances use the same database.

## Environment variables

Configure values independently for local development, staging, and production. Never commit `.env` files or copy production secrets into preview environments.

| Category | Variable | Production requirement |
|---|---|---|
| APPLICATION | `NEXT_PUBLIC_APP_URL` | Required HTTPS origin for canonical URLs, sitemap, email links, callbacks, and redirects. Do not include a path, query, or fragment. |
| AUTH | `AUTH_URL` | Set to the same HTTPS origin as `NEXT_PUBLIC_APP_URL`. |
| AUTH | `AUTH_SECRET` | Required, unique, high-entropy secret. Generate with a cryptographically secure random generator. |
| AUTH | `AUTH_TRUST_HOST` | Set `true` only when requests arrive through a trusted proxy/platform ingress, such as Vercel. |
| DATABASE | `DATABASE_URL` | Required PostgreSQL connection string for the target environment. Restrict network access and use a least-privilege database account. |
| EMAIL | `EMAIL_PROVIDER` | Set to `resend` to send production email. |
| EMAIL | `EMAIL_API_KEY` | Required server-side Resend credential; never prefix with `NEXT_PUBLIC_`. |
| EMAIL | `EMAIL_FROM` | Required sender using a domain verified in Resend. Verification is an operator task. |
| EMAIL | `EMAIL_OTP_MAX_ATTEMPTS` | Optional; defaults to 5, accepted range is 1–10. |
| PAYMENTS | `PAYSTACK_SECRET_KEY` | Required server-side key for payment initialization, verification, and webhook signature checks. Keep test keys in staging; do not switch to live keys before approval. |
| PAYMENTS | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack's public key used in browser integration; use the matching test/live environment. This is intentionally public, unlike the secret key. |
| PAYMENTS | `PAYSTACK_TRANSFERS_ENABLED` | Defaults to disabled. Set `true` only after configuring and verifying Paystack transfers in staging and approving payout operations. |
| PAYMENTS | `PAYSTACK_CALLBACK_URL` | Optional override; if set, it must be `NEXT_PUBLIC_APP_URL/checkout/callback` exactly. Otherwise the callback is derived from the app URL. |
| SECURITY | `PAYOUT_ENCRYPTION_KEY` | Required for payout account encryption; base64 encoding of exactly 32 random bytes. Back it up securely because losing it prevents decryption of saved payout account numbers. |
| STORAGE | `S3_BUCKET` | Required private bucket for product assets. Profile photos are stored in PostgreSQL. Keep the bucket's public access blocked. |
| STORAGE | `S3_REGION` | Required region understood by the selected provider (for example, `auto` for a compatible provider that requires it). |
| STORAGE | `S3_ACCESS_KEY_ID` | Required server-only credential with only the object operations/prefix access needed by the app. |
| STORAGE | `S3_SECRET_ACCESS_KEY` | Required server-only secret. Never expose it to the browser or commit it. |
| STORAGE | `S3_ENDPOINT` | Optional for AWS S3; set the provider's HTTPS S3-compatible endpoint for other services. |
| STORAGE | `S3_FORCE_PATH_STYLE` | Optional; set `true` only if the provider requires path-style bucket URLs. |
| STORAGE | `PRIVATE_PRODUCT_STORAGE_DIR` | Development-only local filesystem path. Do not use this for production on Vercel. |

`DIRECT_URL` and `EMAIL_SERVER` are intentionally omitted: the current Prisma and email implementations do not read them. `.env.example` contains placeholders only.

Example local-only setup is in `.env.example`. Never copy its localhost values into a deployed environment.

## Domain, HTTPS, Auth.js, and SEO

1. Register and attach the real domain to the selected platform.
2. Configure DNS and verify HTTPS for the apex domain and every subdomain that will be used.
3. Set `NEXT_PUBLIC_APP_URL` to the production HTTPS origin; set `AUTH_URL` to the same origin.
4. Configure trusted-host behavior for the platform proxy. Auth.js uses JWT sessions, database-backed session-version checks, and HTTPS-only `__Host-` session cookies in production. Suspended users are rejected during sign-in and session checks.
5. The callback redirect accepts only same-origin path destinations; do not weaken this or disable CSRF protection.
6. `/sitemap.xml` includes public active categories and published products; `/robots.txt` excludes account, admin, seller-management, and API routes. Product canonical and Open Graph paths resolve against the configured app origin.
7. Verify canonical, sitemap, email, login, and Paystack callback URLs on the deployed domain before opening the site to traffic.

`next.config.ts` currently sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers. HSTS is enabled only for production responses. No Content Security Policy is configured: test a provider-aware CSP in staging before enabling one, because the app uses Next.js hydration and a Paystack checkout redirect.

## Database and backups

- Use managed PostgreSQL with encrypted connections, least-privilege credentials, restricted network access, and capacity monitoring.
- Prisma's datasource reads `DATABASE_URL`. Use the connection URL recommended for the chosen provider and ensure it supports Prisma migrations.
- Before every production migration, take a provider-managed snapshot/backup and review the SQL. Apply migrations as a release step with `npm run db:deploy`; verify afterward with `npx prisma migrate status`.
- Recommended backup policy (not yet configured): automated daily backups plus point-in-time recovery if the provider supports it, at least 30 days of retention, and a restore drill into an isolated staging database at least quarterly. Keep backup access separate from application credentials.
- Use expand/contract migrations for schema changes that must coexist with old and new application instances. Never use `migrate reset` on production.
- The coupon model and checkout fields were present in Prisma but absent from the historical migration set. `20261007175000_coupon_schema` now creates those structures idempotently for clean databases, and `20261007180000_coupon_usage_enforcement` backfills successful historical coupon orders and reconciles counters. Review and apply both through the migration workflow in staging before production.
- The refund model was also missing from migration history. `20261008000000_add_refund_table` creates the refund status enum, table, indexes, and order/payment foreign keys; apply it through the normal migration workflow before using the admin refund counts.

## Payments

- Paystack requests are made server-side using `PAYSTACK_SECRET_KEY`. The browser receives only the public key and Paystack authorization URL.
- The webhook endpoint is `/api/payments/paystack/webhook`. It validates `x-paystack-signature` with HMAC-SHA512, then the shared payment handler verifies the transaction with Paystack and checks reference, amount, currency, order state, and idempotent fulfillment before granting purchases.
- Seller payouts use the existing earnings ledger and Paystack transfer flow. Bank details are encrypted at rest and user interfaces expose only the bank name and last four digits. Admin approval/retry is blocked unless `PAYSTACK_TRANSFERS_ENABLED=true`; ambiguous outcomes remain reserved pending server-side Paystack verification. Configure transfer success, failed, and reversed events on the signed webhook endpoint.
- Configure the webhook URL as `https://<production-domain>/api/payments/paystack/webhook` in Paystack. Confirm the configured provider environment and test signed success, failure, duplicate, and mismatched-amount events in staging.
- Keep test and live keys separate. Do not enter live keys or switch traffic until staging tests, reconciliation, monitoring, and an explicit go-live approval are complete.

## Email

- Configure `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, and `EMAIL_FROM` only in server-side environment settings.
- Verify the sender domain and DNS records in Resend before testing account verification, password reset, seller decision, payment, payout, and notification emails.
- Do not claim email is production-ready until a real message has been delivered and link URLs have been checked on the production domain.

## Built-in support assistant

- The assistant uses Devisima's built-in help responses and does not call external AI providers. No AI provider credentials or model settings are required.
- Product questions use the server-fetched details of published products. Seller earnings and payout questions use only the authenticated seller's own records.
- The assistant rate-limits messages and bounds message size/history. The chat warns users not to send passwords, bank details, or payment credentials. Unknown questions are directed to Devisima support rather than answered with invented details.

## Files and storage

- Product assets use a server-only storage adapter. In development without S3 variables it uses `PRIVATE_PRODUCT_STORAGE_DIR`; in production it requires the configured private S3-compatible bucket. Profile photos are posted to the app and stored in PostgreSQL.
- The bucket is never public. Browser uploads use five-minute presigned `PUT` URLs; a server-side finalize request checks the signed upload claims, object size, and file signature before moving the object from `pending/` to its permanent key and writing database metadata. Unfinalized objects must expire automatically.
- Product uploads bypass Vercel's function request-body limit with direct bucket uploads, preserving the existing 25 MB ZIP limit. Profile photos are posted through the app and stored in PostgreSQL, with a 4 MB limit to stay below the function request-body limit. Local filesystem product uploads are retained only for development and must not be used as production storage on Vercel.
- Configure bucket CORS to allow `PUT` from the exact production app origin with the `Content-Type` and `Content-Length` headers. Do not allow public `GET`, wildcard origins, or browser access to bucket credentials. Keep provider public-access blocking enabled.
- A typical S3 CORS rule is `AllowedOrigins: ["https://your-production-domain"]`, `AllowedMethods: ["PUT"]`, `AllowedHeaders: ["content-type", "content-length"]`, with a short `MaxAgeSeconds`. Replace the origin with the exact app origin; add a separate localhost origin only to a development bucket if needed.
- Configure an object lifecycle rule to delete objects under `pending/` after one day. Restrict application credentials to the bucket's object read/write/delete operations; do not grant bucket administration or listing unless the provider requires it.
- Require provider-managed encryption at rest and TLS in transit. The application needs object `Get`, `Put`, and `Delete` permissions (including copy source/destination operations); do not grant bucket-policy, lifecycle, or account administration permissions to the application key.
- Existing uploads still use their existing UUID storage keys. Before switching a live environment, copy every existing file from `.private-product-storage/` into the bucket root without renaming keys, then compare file counts and verify representative hashes/downloads. Do not deploy until this transfer and restore procedure are tested in isolated staging.
- Buyer downloads continue through the authenticated application route, which rechecks the buyer's paid purchase and logs the download; product images remain subject to publication/owner/admin checks. Do not return raw object URLs for permanent assets.

## Rate limiting, CORS, logs, and monitoring

- Authentication, account recovery, seller application, payout, download, product asset upload, avatar upload, and product-view limits are stored in PostgreSQL and therefore shared by app instances. Revisit limits and trusted proxy IP extraction for the selected ingress. Add checkout throttling before exposing the service to untrusted traffic.
- No permissive `Access-Control-Allow-Origin: *` policy was found. Keep sensitive APIs same-origin unless a documented integration requires specific trusted origins.
- Avoid logging tokens, credentials, full bank account data, or secret environment values. Review provider logs and access controls before launch.
- No error-monitoring provider, payment alerting, database alerting, or email-delivery dashboard integration is configured in this repository. Select and configure operational alerts for server errors, payment/webhook failures, database availability, failed downloads, email delivery, and payout failures.
- No cron or background task was found. Do not schedule a made-up job; add a scheduler only when a concrete cleanup/reconciliation task is introduced.
- Seller earnings are posted only during verified payment fulfillment. The admin earnings reconciliation screen repairs missing sale rows idempotently and can create negative ledger entries from already-successful `Refund` records. The repository currently has no refund initiation/provider verification workflow; any future refund handler must first verify the provider result, then call the shared `reconcileSuccessfulRefundEarnings` service after the refund row reaches `SUCCESS`.

## Staging and release sequence

1. Create a separate staging project, PostgreSQL database, Auth secret, Resend/test-email configuration, Paystack test keys, and an isolated private bucket with staging-only credentials and CORS.
2. Never connect staging to production financial data or storage.
3. Apply all pending migrations to staging with `npm run db:deploy`; verify schema status and clean-install migrations on a disposable database.
4. Configure the production-like environment and validate domain callbacks, email delivery, access controls, private uploads/downloads, and test payment lifecycle.
5. Run verification commands:

   ```powershell
   npm ci
   npm run lint
   npx tsc --noEmit
   npx prisma validate
   npx prisma migrate status
   npm run build
   ```

6. Configure the same required environment variables in the production platform, take/verify a backup, review pending migration SQL, and apply migrations as a controlled release step.
7. Deploy manually through the chosen platform only after the storage blocker and checklist are resolved. No automatic deployment or live Paystack switch is configured here.
8. Run the smoke tests below, monitor logs/alerts, and keep a tested rollback/recovery procedure.

## Production checklist

### Database
- [ ] Managed production PostgreSQL and least-privilege credentials
- [ ] `DATABASE_URL` configured for the deployment environment
- [ ] Clean-install and existing-database migrations tested in staging
- [ ] `npx prisma migrate status` reports current after approved migration deployment
- [ ] Automated backups/PITR configured and restore drill completed
- [ ] Coupon schema and usage backfill reviewed and verified

### Authentication
- [ ] `AUTH_SECRET` generated uniquely for production
- [ ] `NEXT_PUBLIC_APP_URL` and `AUTH_URL` use the production HTTPS origin
- [ ] Trusted-host setting matches the verified platform proxy
- [ ] Secure cookie behavior, login, registration, email verification, password reset, and logout tested
- [ ] USER, SELLER, ADMIN authorization and suspended-account denial tested

### Email
- [ ] Resend key configured only server-side
- [ ] Sender domain verified and `EMAIL_FROM` confirmed
- [ ] Verification, reset, seller, payment, payout, and notification emails tested

### Payments
- [ ] Paystack test-mode initialization, verification, webhook signature, and idempotency tested
- [ ] Callback URL and webhook URL use production HTTPS domain
- [ ] Amount, currency, order reference, and duplicate event checks tested
- [ ] Staging buyer journey completed: pay for a published product, verify the order and purchase record, open its purchase details, download the file, and confirm an unauthorized account cannot download it
- [ ] Staging refund journey completed: submit a request from purchase details, confirm it reaches the support/review queue, verify the decision and provider reversal, and confirm buyer access and seller ledger treatment match the final refund
- [ ] Confirm the operational refund-review and Paystack reversal process exists before launch; currently the application records a pending request but does not provide staff review or initiate a reversal
- [ ] Confirm `support@devisima.app` receives messages and assign an owner for payment and refund cases
- [ ] Live keys held until explicit go-live approval

### Storage
- [ ] Private S3-compatible provider, bucket, region, and server-only credentials configured
- [ ] Exact-origin upload CORS and one-day `pending/` lifecycle rule configured
- [ ] Existing local assets transferred with unchanged storage keys and verified
- [ ] Uploaded paid files are outside public/static paths
- [ ] Presigned upload and server-side size/signature finalization tested for image, avatar, and 25 MB ZIP
- [ ] Purchase ownership, short-lived access, and download logging tested
- [ ] Storage permissions, backup, restore, and credential rotation verified

### Security, SEO, performance, and operations
- [ ] HTTPS and security headers checked on deployed responses
- [ ] CSP decision tested in staging; no wildcard CORS on authenticated APIs
- [ ] Rate limits tested behind the real proxy and shared across instances
- [ ] No secrets in repository, browser bundles, logs, or public environment variables
- [ ] Sitemap, robots, canonical, and Open Graph URLs use production origin
- [ ] Production build and database query performance reviewed
- [ ] Monitoring/alerting decision implemented and on-call ownership assigned
- [ ] Manual USER, SELLER, ADMIN, payment, webhook, and download smoke tests completed
