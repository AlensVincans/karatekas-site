# Karatekas

Modern ecommerce storefront for Karatekas.eu karate equipment with B2C, B2B and admin roles.

## Included

- Store routes: `/`, `/catalog`, `/product/[id]`, `/cart`, `/login`, `/register`, `/account`, `/admin`.
- PostgreSQL persistence for products, users, orders, stock, invoices, payments and shipping data.
- Product catalog with brands, categories, images, descriptions, variations, B2C/B2B prices, discounts and stock.
- Role-aware navigation and admin-only management screens.
- B2B requests from customer accounts with admin approval.
- Montonio payment flow and shipping selection flow.
- Stock decrement on order creation and restore when an interrupted card checkout is cancelled.
- SMTP email support through backend-only environment variables.

## Environment

Create a local `.env` file or set these variables in DigitalOcean App Platform:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:25060/defaultdb?sslmode=require

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
MONTONIO_SITE_URL=https://your-domain.example
```

The PostgreSQL connection automatically enforces `sslmode=require` and libpq-compatible SSL parsing for DigitalOcean.

## Database

Run migrations:

```bash
npm run db:migrate
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

## Validate

```bash
npm run typecheck
npm run build
```
