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
