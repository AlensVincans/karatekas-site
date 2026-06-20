# Baltic Commerce

Interactive ecommerce MVP for a Baltic B2C/B2B product catalog.

## What is included

- Commercial home page with hero imagery, brand rail, quick categories, search and filters.
- Product catalog with brands, categories, generated product photos, descriptions, variations, B2C/B2B prices, discounts and stock.
- B2B view with crossed retail price, active B2B price, invoice payment and 15-day deferred payment option.
- Cart and invoice surface with PVN toggle, PDF/print action, CSV export and XML export.
- Admin panel for products, category editing, Excel/CSV import, warehouse, clients, orders, invoices, discounts, supplies, costing and anti-spam settings.
- Warehouse values for physical stock, reserved stock, available stock, expected supply, lots, purchase price, delivery, customs, PVN, FX, cost and margin.
- Local generated assets in `public/commerce-hero.png` and `public/product-sheet.png`.

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
