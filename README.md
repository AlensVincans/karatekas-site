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

## Validate

```bash
npm run build
npm run lint
```

## Production integrations still need real credentials

The UI contains the correct surfaces for card acquiring, 3D Secure, Apple Pay,
Google Pay, invoice payment, Omniva, DPD, Unisend, Latvijas Pasts, email
delivery and captcha providers. Live processing requires provider contracts,
API keys, webhook handlers and persistent storage.

The checked-in SQLite files are real local databases for schema and seed data.
Cloudflare Worker deployments cannot write to local `.sqlite` files at runtime;
for production persistence, move these schemas to Cloudflare D1 or a backend
service with SQLite/PostgreSQL.
