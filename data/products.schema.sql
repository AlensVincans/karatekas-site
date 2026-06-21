CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  image_slot TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE product_variations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  b2c_price REAL NOT NULL,
  b2b_price REAL NOT NULL
);

CREATE TABLE stock_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variation_id TEXT NOT NULL REFERENCES product_variations(id),
  batch TEXT NOT NULL,
  physical_qty INTEGER NOT NULL,
  reserved_qty INTEGER NOT NULL,
  expected_qty INTEGER NOT NULL,
  purchase_price REAL NOT NULL,
  shipping_cost REAL NOT NULL,
  customs_cost REAL NOT NULL,
  vat_rate REAL NOT NULL,
  fx_rate REAL NOT NULL,
  eta TEXT NOT NULL
);

CREATE TABLE discounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('brand', 'product', 'variation')),
  target_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value REAL NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('user', 'b2b', 'both')),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  payment_terms TEXT NOT NULL
);
