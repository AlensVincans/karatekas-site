# Karatekas

Modern ecommerce storefront for Karatekas.eu karate equipment with B2C, B2B and admin roles.

## Included

- Store routes: `/`, `/catalog`, `/product/[id]`, `/cart`, `/login`, `/register`, `/account`, `/admin`.
- PostgreSQL persistence for products, users, orders, stock, invoices, payments and shipping data.
- Product catalog with brands, categories, images, descriptions, variations, B2C/B2B prices, discounts and stock.
- Role-aware navigation and admin-only management screens.
- B2B requests from customer accounts with admin approval.
- Montonio payment flow and shipping selection flow.
- Reservation-based stock flow: pending orders reserve stock, paid webhooks confirm physical stock deduction, failed/cancelled/expired payments release reserved stock.
- Prices in the catalog and checkout are treated as VAT/PVN included. The backend calculates the included 21% PVN breakdown for orders and invoices.
- Card payment invoices are issued only after a successful Montonio paid webhook. B2B invoice/defer orders can receive invoice data when the order is created.
- SMTP email support through backend-only environment variables.

## Environment

Create a local `.env` file or set these variables in DigitalOcean App Platform:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:25060/defaultdb?sslmode=require
APP_URL=https://karatekas.eu
SESSION_SECRET=replace-with-a-stable-random-secret

SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@karatekas.eu
SMTP_PASS=...
SMTP_FROM=info@karatekas.eu
ADMIN_ORDER_EMAIL=info@karatekas.eu

MONTONIO_ACCESS_KEY=...
MONTONIO_SECRET_KEY=...
MONTONIO_ENV=sandbox
MONTONIO_SITE_URL=https://karatekas.eu
MONTONIO_SHIPPING_USE_API=true
MONTONIO_SHIPPING_ALLOW_MANUAL_PRICES=false
ALLOW_LEGACY_PRODUCT_ARRAY_PUT=false
```

The PostgreSQL connection automatically enforces `sslmode=require` and libpq-compatible SSL parsing for DigitalOcean.

## Database

Run migrations:

```bash
npm run db:migrate
```

Migrations are additive and tracked in `kg_migrations`. Do not run seed/reset scripts automatically in production.

Check database readiness without printing secrets:

```bash
npm run db:doctor
```

Seed the current product catalog into PostgreSQL:

```bash
npm run db:seed
```

Create or reset an admin user:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPass1 npm run db:create-admin
```

PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="StrongPass1"
npm run db:create-admin
```

`ADMIN_PASSWORD` must be at least 8 characters and contain at least one uppercase letter.

If the deployed site opens but products/login are empty, check:

```bash
curl https://karatekas.eu/api/health
```

For a new or empty DigitalOcean PostgreSQL database, run this sequence once with the production `DATABASE_URL`:

```bash
npm run db:migrate
npm run db:seed
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPass1 npm run db:create-admin
npm run db:doctor
```

PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="StrongPass1"
npm run db:create-admin
npm run db:doctor
```

## Run Locally

```bash
npm install
npm run dev
```

The scripts automatically use the bundled Codex Node runtime when the system Node.js version is older than the vinext requirement.

## DigitalOcean

Use Node.js `22.13.0` or newer.

```bash
npm install
npm run build
npm run start
```

For DigitalOcean App Platform, use `npm run build` as the build command and `npm run start` as the run command. Set all secrets in the app platform dashboard, not in the repository.

Run `npm run db:migrate` once against the production `DATABASE_URL` before the first deploy that uses a new migration. Keep `SESSION_SECRET` stable across redeploys or existing sessions will be invalidated.

## Order and Stock Flow

1. Customer submits checkout.
2. Backend validates product IDs, variation IDs, quantity, delivery method and pickup point/address.
3. Backend recalculates B2C/B2B prices, DB promotions, shipping, included PVN and final total.
4. Pending order is created and `stock_levels.reserved` is increased atomically.
5. Montonio payment is created for card orders.
6. Only a valid Montonio paid webhook confirms the order, creates the final invoice, deducts `stock_levels.physical` and decreases `reserved`.
7. Failed, cancelled, expired or abandoned card orders release `reserved` stock.
8. Manual stock edits must use inventory endpoints, not product edit payloads.
9. Admins can manually trigger cleanup of old pending card orders with `POST /api/admin/order-cleanup`; it releases reservations through the same stock lifecycle code.

## Admin Product and Stock Flow

- Product creation uses `POST /api/admin/products`.
- Product metadata updates use `PATCH /api/admin/products/:id`.
- Variation metadata and sell prices use `PATCH /api/admin/products/:id/variations/:variationId`.
- Stock quantity edits use `PATCH /api/admin/stock/:variationId` or the legacy-compatible `/api/inventory` admin route.
- Cost fields use `PATCH /api/admin/stock/:variationId/cost`.
- Normal product edits do not update `stock_levels.physical`, `reserved`, `expected`, `purchase`, `shipping`, `customs`, `vat_rate`, `fx` or `lots`.
- The legacy whole-catalog `PUT /api/admin/products` is disabled by default. Only set `ALLOW_LEGACY_PRODUCT_ARRAY_PUT=true` for a short, controlled migration window.

## Security Notes

- Auth uses a signed server session in a secure httpOnly cookie. Roles and B2B pricing are read from the server session/database, not frontend state.
- Admin mutating endpoints require the session cookie plus the `x-csrf-token` double-submit header.
- Rate limiting is currently in-memory per Node.js process. This is production-safe only for a single container/instance. If DigitalOcean scales the app horizontally, move rate limits to Redis, Postgres, or a WAF/rate-limit service.
- CSP currently removes `unsafe-eval`. Inline scripts/styles remain allowed because the current Next/Vinext frontend still emits inline hydration/style code; removing `unsafe-inline` should be handled with a nonce/hash refactor and full browser verification.
- Product and banner image references are persisted in PostgreSQL as URLs/data URLs. Real object storage upload is not implemented yet; before heavy production image management, add DigitalOcean Spaces/S3/Cloudinary upload, MIME/size validation, safe filenames and image optimization.

## Validate

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Production Checklist

- Rotate any secrets that were shared during development.
- Set `APP_URL=https://karatekas.eu` so emails and Montonio return URLs do not use the temporary DigitalOcean domain.
- Set Montonio sandbox keys only with `MONTONIO_ENV=sandbox` and production keys only with `MONTONIO_ENV=production`.
- Configure PostgreSQL backups and test restore before launch.
- Keep `MONTONIO_SHIPPING_ALLOW_MANUAL_PRICES=false` in production unless manual fallback prices are intentionally approved.
- Keep `ALLOW_LEGACY_PRODUCT_ARRAY_PUT=false` in production.
