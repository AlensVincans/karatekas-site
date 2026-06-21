CREATE TABLE catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_sheet TEXT NOT NULL,
  brand TEXT NOT NULL,
  product_group TEXT NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  size TEXT,
  colour TEXT,
  club_price REAL,
  retail_price REAL,
  image_1 TEXT,
  image_2 TEXT,
  image_3 TEXT,
  image_4 TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  imported_at TEXT NOT NULL
);

CREATE INDEX catalog_items_brand_idx ON catalog_items (brand);
CREATE INDEX catalog_items_group_idx ON catalog_items (product_group);
CREATE INDEX catalog_items_sku_idx ON catalog_items (sku);
CREATE INDEX catalog_items_title_idx ON catalog_items (title);
