# Karatekas Gear

Multi-page ecommerce MVP for karate equipment with B2C, B2B and admin roles.

## What is included

- Store routes: `/`, `/catalog`, `/product/[id]`, `/cart`, `/login`, `/register`, `/account`, `/b2b`, `/admin`.
- Karate catalog with brands, categories, product images, descriptions, variations, B2C/B2B prices, discounts and stock.
- Excel import from `Sajt_karatekas kihon_price_list.xlsx`: all workbook sheets are merged into one SQLite table, `catalog_items`.
- Three user roles: normal user, B2B customer and admin.
- Role-aware navigation: admin and B2B pages appear only after the right login.
- B2B pricing with crossed retail price, active club price, invoice payment and 15-day deferred payment.
- Cart and checkout with PVN toggle, card payment surface, invoice payment, delivery options and order status.
- Montonio card checkout route for Visa/Mastercard, 3D Secure, Apple Pay and Google Pay redirect payments.
- Lean admin panel for editing product prices/stock/status, viewing clients and managing orders.
- Warehouse values for physical stock, reserved stock, available stock, lots, purchase price, delivery, customs, PVN, FX, cost and margin.
- SQLite seed databases:
  - `data/users.sqlite`
  - `data/products.sqlite`
  - schemas in `data/*.schema.sql`
  - generator in `scripts/create-sqlite-dbs.py`
  - Excel importer in `scripts/import_karate_catalog.py`

## Demo users

```text
admin@karate.test / admin123
buyer@karate.test / user123
club@karate.test / b2b123
```

Run this to recreate the SQLite databases and regenerate the storefront catalog:

```bash
python scripts/create-sqlite-dbs.py
```

## Run locally

```bash
npm install
npm run dev
```

The scripts automatically use the bundled Codex Node runtime when the system
Node.js version is older than the vinext requirement.

## DigitalOcean

Use Node.js `22.13.0` or newer.

```bash
npm install
npm run build
npm run start
```

For DigitalOcean App Platform, use `npm run build` as the build command and
`npm run start` as the run command. Set the Montonio variables from the section
below in the app platform dashboard, not in the repository.

## Validate

```bash
npm run build
npm run lint
```

## Montonio

Set these environment variables in hosting:

```bash
MONTONIO_ACCESS_KEY=...
MONTONIO_SECRET_KEY=...
MONTONIO_ENV=production
MONTONIO_SITE_URL=https://your-domain.example
```

Use `MONTONIO_ENV=sandbox` for the sandbox API. Optional store address
defaults are `MONTONIO_COUNTRY`, `MONTONIO_POSTAL_CODE`,
`MONTONIO_ADDRESS_LINE1`, `MONTONIO_LOCALITY` and `MONTONIO_REGION`.

## Production integrations still need real credentials

The UI contains the correct surfaces for invoice payment, Omniva, DPD,
Unisend, Latvijas Pasts, email delivery and captcha providers. Live processing
requires provider contracts, API keys, webhook handlers and persistent storage.

The checked-in SQLite files are real local databases for schema and seed data.
For production persistence on DigitalOcean, move these schemas to a backend
service with SQLite/PostgreSQL and set the Montonio environment variables in
the app platform dashboard.
