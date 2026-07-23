import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("auth uses server session cookie and exposes /api/auth/me", () => {
  assert.match(source("app/api/auth/login/route.ts"), /setSessionCookie/);
  assert.match(source("app/api/auth/me/route.ts"), /getSessionUser/);
  assert.doesNotMatch(source("components/session.tsx"), /localStorage\.setItem\(["']bc_session/);
});

test("promotions and product image overrides are not browser localStorage storage", () => {
  assert.doesNotMatch(source("lib/promotions.ts"), /localStorage|kg_promo/);
  assert.doesNotMatch(source("lib/product-media.ts"), /localStorage|kg_product_images/);
  assert.match(source("lib/promotions-store.ts"), /site_settings/);
  assert.match(source("lib/product-media-store.ts"), /product_image_overrides/);
});

test("checkout pricing keeps VAT included and applies DB promotions server-side", () => {
  const checkout = source("lib/checkout-server.ts");

  assert.match(checkout, /getPromotionState/);
  assert.match(checkout, /applyPromoPrice/);
  assert.match(checkout, /21\s*\/\s*121/);
  assert.doesNotMatch(checkout, /PVN 21%/);
});

test("card orders get final invoice only after paid webhook", () => {
  const orders = source("lib/orders.ts");
  const webhook = source("app/api/montonio/notify/route.ts");

  assert.match(orders, /input\.paymentMethod !== "card"/);
  assert.match(orders, /ensureInvoiceForOrder/);
  assert.match(webhook, /ensureInvoiceForOrder\(updated\)/);
});

test("stock reservations and lifecycle changes are logged", () => {
  const inventory = source("lib/inventory.ts");
  const migration = source("db/migrations/003_production_hardening.sql");

  assert.match(inventory, /insert into stock_history/);
  assert.match(inventory, /action: "reserve"/);
  assert.match(inventory, /action: "confirm"/);
  assert.match(inventory, /action: "release"/);
  assert.match(migration, /audit_log/);
  assert.match(migration, /order_status_history/);
});

test("invoice access and Montonio payment payload avoid unsafe regressions", () => {
  assert.match(source("app/api/orders/[id]/invoice/route.ts"), /Invoice is not available yet/);
  assert.doesNotMatch(source("app/api/montonio/order/route.ts"), /preferredMethod/);
  assert.match(source("lib/montonio-shipping.ts"), /MONTONIO_SHIPPING_ALLOW_MANUAL_PRICES/);
  assert.match(source("lib/montonio-shipping.ts"), /packageWeightKg/);
});

test("legacy whole-catalog product replacement is restricted", () => {
  const route = source("app/api/admin/products/route.ts");
  const adminPage = source("app/admin/page.tsx");

  assert.match(route, /ALLOW_LEGACY_PRODUCT_ARRAY_PUT/);
  assert.match(route, /Legacy whole-catalog product replacement is disabled/);
  assert.doesNotMatch(adminPage, /method:\s*"PUT"[\s\S]{0,120}\/api\/admin\/products/);
  assert.match(adminPage, /\/api\/admin\/products\/\$\{encodeURIComponent\(productId\)\}/);
});

test("product edits do not overwrite stock or cost fields", () => {
  const store = source("lib/products-store.ts");
  const productPatch = source("app/api/admin/products/[id]/route.ts");

  assert.doesNotMatch(store, /physical\s*=\s*excluded\.physical/);
  assert.doesNotMatch(store, /reserved\s*=\s*excluded\.reserved/);
  assert.doesNotMatch(store, /expected\s*=\s*excluded\.expected/);
  assert.doesNotMatch(store, /purchase\s*=\s*excluded\.purchase/);
  assert.doesNotMatch(store, /shipping\s*=\s*excluded\.shipping/);
  assert.doesNotMatch(store, /customs\s*=\s*excluded\.customs/);
  assert.doesNotMatch(store, /vat_rate\s*=\s*excluded\.vat_rate/);
  assert.doesNotMatch(store, /fx\s*=\s*excluded\.fx/);
  assert.doesNotMatch(store, /lots\s*=\s*excluded\.lots/);
  assert.match(productPatch, /stock:\s*currentVariation\?\.stock\s*\?\?\s*variation\.stock/);
  assert.match(source("app/api/admin/stock/[variationId]/cost/route.ts"), /updateInventoryCost/);
});

test("admin mutating routes require CSRF and cleanup exists", () => {
  const auth = source("lib/server-auth.ts");

  assert.match(auth, /csrfCookieName/);
  assert.match(auth, /requireAdminMutation/);
  assert.match(source("app/api/admin/promotions/route.ts"), /requireAdminMutation\(request\)/);
  assert.match(source("app/api/admin/product-images/route.ts"), /requireAdminMutation\(request\)/);
  assert.match(source("app/api/orders/[id]/route.ts"), /requireAdminMutation\(request\)/);
  assert.match(source("app/api/admin/order-cleanup/route.ts"), /cleanupPendingCardOrders/);
});

test("order statuses and CSP avoid known legacy values", () => {
  const orders = source("lib/orders.ts");
  const orderRoute = source("app/api/orders/[id]/route.ts");
  const config = source("next.config.ts");

  assert.match(orders, /awaiting_payment/);
  assert.match(orders, /normalizeStoreOrderStatus/);
  assert.doesNotMatch(orderRoute, /"in_process"/);
  assert.doesNotMatch(orderRoute, /"unpaid"/);
  assert.doesNotMatch(config, /unsafe-eval/);
});

test("README documents production caveats for rate limits and image storage", () => {
  const readme = source("README.md");

  assert.match(readme, /single container\/instance/);
  assert.match(readme, /DigitalOcean Spaces\/S3\/Cloudinary/);
  assert.match(readme, /ALLOW_LEGACY_PRODUCT_ARRAY_PUT=false/);
});
