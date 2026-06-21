# Baltic Commerce

Interactive multi-page ecommerce MVP for a Baltic B2C/B2B product catalog.

## What is included

- Multi-page store routes: `/`, `/catalog`, `/product/[id]`, `/cart`, `/login`, `/register`, `/account`, `/b2b`, `/admin`.
- Product catalog with brands, categories, generated product photos, descriptions, variations, B2C/B2B prices, discounts and stock.
- Three user roles: normal user, B2B customer and admin.
- Login and registration demo flow with role-aware navigation and B2B access control.
- B2B view with crossed retail price, active B2B price, invoice payment and 15-day deferred payment option.
- Cart and checkout surface with PVN toggle, card payment, invoice payment, delivery options and order status.
- Admin panel for products, category editing, Excel/CSV import, warehouse, clients, orders, invoices, discounts, supplies, costing and anti-spam settings.
- Warehouse values for physical stock, reserved stock, available stock, expected supply, lots, purchase price, delivery, customs, PVN, FX, cost and margin.
- Local generated assets in `public/commerce-hero.png` and `public/product-sheet.png`.
- SQLite seed databases:
  - `data/users.sqlite`
  - `data/products.sqlite`
  - schemas in `data/*.schema.sql`
  - generator in `scripts/create-sqlite-dbs.py`

## Demo users

```text
admin@baltic.test / admin123
buyer@baltic.test / user123
b2b@baltic.test / b2b123
```

Run this to recreate the SQLite databases:

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
