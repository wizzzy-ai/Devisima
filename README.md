This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication setup

Authentication uses PostgreSQL through Prisma. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you control. Generate a private `AUTH_SECRET` (for example with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). Keep `.env` private; it is ignored by Git.

The production build regenerates Prisma Client from the current schema before compiling the app. After changing the Prisma schema or database configuration, rebuild and restart the production server.

Run the initial schema migration and start the app:

```bash
npm install
npm run db:migrate
npm run dev
```

For local email testing, leave the email provider unset. Verification codes and password reset links are written to the development server log and are never sent to an external provider. OTP codes are not logged in production. To send real email with Resend, configure `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, and `EMAIL_FROM`. To send through Google SMTP, configure `EMAIL_PROVIDER=google-smtp`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD` (a Google App Password), and `EMAIL_FROM` as the Gmail address or an authorized sender alias. Keep provider credentials server-side. Set `AUTH_URL` to the public origin and `AUTH_TRUST_HOST=true` only when the deployment host/proxy is trusted.

Registration requires accepting the Terms & Conditions and a password of at least 8 characters with uppercase, lowercase, and numeric characters. New accounts receive a six-digit verification code that expires after 10 minutes. Codes are stored as keyed hashes, allow five attempts by default, and can be resent after a 60-second cooldown. Set `EMAIL_OTP_MAX_ATTEMPTS` to a value from 1 to 10 to change the attempt limit. New accounts must verify their email before signing in.

To test email verification locally, register with a valid email address and check the development server log for the code. Enter it at `/verify-email`; resend becomes available after the countdown. The OTP is single-use, and each resend replaces the previous code.

## Roles and seller applications

New accounts always receive the `USER` role. Users can apply at `/seller/apply`; applications are reviewed by an administrator at `/admin/seller-applications`. An approval atomically changes the application to `APPROVED` and the applicant role to `SELLER`. Rejected users can submit a new application. Server pages and API routes check current database roles; navigation visibility is only a convenience.

The first administrator must be assigned through the trusted local CLI, not public registration. Run it only from a trusted machine with access to the database, and ensure the target account has verified its email:

```bash
npm run admin:promote -- admin@example.com --confirm-admin
```

The CLI requires an explicit confirmation flag and never creates a user. Auth.js refreshes the role from the database on the next session check. Keep database access restricted to trusted operators.

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Seller products

Approved sellers manage drafts at `/seller/products`. Products remain hidden from the marketplace until an administrator approves them at `/admin/products`. Editing a published listing sends it back for review. Private ZIP uploads are served only through authenticated seller/admin routes and are never stored under `public/`.

Development product uploads are stored under `.private-product-storage/` (or `PRIVATE_PRODUCT_STORAGE_DIR`). Production product uploads use the private S3-compatible adapter configured by `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Product files upload directly to the bucket using five-minute presigned URLs, then the server verifies size and file signatures before recording them. Configure the bucket as private, allow `PUT` only from the application origin, and expire unfinalized objects under `pending/`. Profile photos (up to 4 MB) are posted to the application and stored as image bytes in PostgreSQL; the user record stores the photo URL.

## Purchases and secure downloads

Apply the `20261007120000_secure_purchase_downloads` migration before deploying the Purchases pages. Verified purchases are listed at `/purchases`; purchase details expose only private ZIP assets belonging to that purchase. Download links are signed with `AUTH_SECRET`, expire after two minutes, require the buyer's active session, and are rechecked against the paid order and successful payment before the app streams the file. Download events are recorded and rate-limited per account.

The development-only filesystem adapter uses a directory outside `public`; production instances use private object storage. Existing local upload files must be transferred to the configured bucket without changing their storage keys before switching environments. Buyer downloads continue through the authenticated application route rather than exposing permanent bucket URLs.

## Notifications

Apply the `20261007160000_notifications_system` migration before deploying the notification center. Authenticated users can view their paginated notifications at `/notifications` and manage email preferences at `/settings/notifications`. In-app notification queries and read updates are scoped to the current server-side session. Important event emails use the existing Resend adapter and respect each account's email preferences; email delivery is independent from in-app notification storage.

Payment, purchase, seller application, product moderation, sale, and payout events currently create notifications from their application event handlers. Review, refund, coupon-creation, and report notifications should be connected when those write/review workflows are implemented; the system does not generate placeholder notifications for workflows that have not occurred.

## Analytics

Apply the `20261007170000_product_view_tracking` migration before deploying analytics. Marketplace reporting is available to administrators at `/admin/analytics`; sellers can view only their own reporting at `/seller/analytics`, with per-product details at `/seller/products/[id]`. Analytics use UTC date ranges, verified paid orders, successful payments, and seller financial ledger entries. Product views are counted once per product, visitor session, and UTC day; seller visits to their own products are excluded. CSV sales exports are available from each analytics page.

## Seller earnings

`/seller/earnings` reads seller-scoped `SellerTransaction` rows and the same balance service used by payout requests. Verified Paystack payment fulfillment writes sale, commission, and net earnings once per order item using the configured marketplace commission and earning hold. Administrators can review and idempotently repair missing sale rows at `/admin/earnings/reconciliation`; that operation only considers paid orders with successful payments. The same page can create negative, idempotent seller ledger adjustments for successful refund records. Full order refunds reverse the original seller earnings proportionally across the order items; refund processing itself is not exposed as a buyer/admin request flow in this release.

## Production deployment

See [PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md) for the production configuration checklist, environment variables, migration workflow, private storage setup, backups, staging, and release steps. Production deployment and Paystack live-mode activation are intentionally manual.
