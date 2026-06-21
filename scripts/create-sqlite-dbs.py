import hashlib
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
USERS_DB = DATA / "users.sqlite"
PRODUCTS_DB = DATA / "products.sqlite"


def password_hash(password: str) -> str:
  return hashlib.sha256(password.encode("utf-8")).hexdigest()


def reset(path: Path) -> sqlite3.Connection:
  if path.exists():
    path.unlink()
  return sqlite3.connect(path)


def load_schema(conn: sqlite3.Connection, filename: str) -> None:
  conn.executescript((DATA / filename).read_text(encoding="utf-8"))


def create_users_db() -> None:
  conn = reset(USERS_DB)
  load_schema(conn, "users.schema.sql")
  users = [
    (
      "usr-admin",
      "Admin",
      "admin@baltic.test",
      password_hash("admin123"),
      "admin",
      None,
      None,
      0,
      1,
      "2026-06-21T00:00:00Z",
    ),
    (
      "usr-b2c",
      "Marta Ozola",
      "buyer@baltic.test",
      password_hash("user123"),
      "user",
      None,
      None,
      0,
      1,
      "2026-06-21T00:00:00Z",
    ),
    (
      "usr-b2b",
      "SIA Baltic Service",
      "b2b@baltic.test",
      password_hash("b2b123"),
      "b2b",
      "SIA Baltic Service",
      "LV40203000000",
      4500,
      1,
      "2026-06-21T00:00:00Z",
    ),
  ]
  conn.executemany(
    """
    INSERT INTO users (
      id, name, email, password_hash, role, company, vat_number,
      credit_limit, email_confirmed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    users,
  )
  conn.executemany(
    "INSERT INTO audit_log (user_id, action, metadata, created_at) VALUES (?, ?, ?, ?)",
    [
      ("usr-admin", "seed", "admin account", "2026-06-21T00:00:00Z"),
      ("usr-b2c", "seed", "retail account", "2026-06-21T00:00:00Z"),
      ("usr-b2b", "seed", "b2b account", "2026-06-21T00:00:00Z"),
    ],
  )
  conn.commit()
  conn.close()


def create_products_db() -> None:
  conn = reset(PRODUCTS_DB)
  load_schema(conn, "products.schema.sql")

  brands = [
    ("baltgear", "BaltGear"),
    ("nordline", "Nordline"),
    ("safepro", "SafePro"),
    ("labelpro", "LabelPro"),
    ("storeflex", "StoreFlex"),
    ("lumiq", "Lumiq"),
  ]
  categories = [
    ("tools", "Инструменты", None, 10),
    ("warehouse-labeling", "Склад и маркировка", None, 20),
    ("safety", "Защита", None, 30),
    ("warehouse-equipment", "Складское оборудование", None, 40),
    ("lighting", "Освещение", None, 50),
    ("consumables", "Расходники", None, 60),
  ]
  products = [
    ("drill-bg18", "baltgear", "tools", "Аккумуляторная дрель BG-18", "Комплект для монтажа и сервиса.", "топ продаж,акция", "0,0", 1),
    ("scanner-m2", "nordline", "warehouse-labeling", "Сканер штрихкодов NordScan M2", "Ручной 1D/2D сканер для склада.", "B2B хит,новинка", "50,0", 1),
    ("glasses-clear", "safepro", "safety", "Защитные очки SafePro Clear", "Очки с антицарапинным покрытием.", "PVN 21%,опт", "100,0", 1),
    ("printer-lp420", "labelpro", "warehouse-labeling", "Термопринтер LabelPro 420", "Компактная печать этикеток.", "счета,склад", "0,100", 1),
    ("shelf-storeflex", "storeflex", "warehouse-equipment", "Стеллаж модульный StoreFlex", "Металлический модуль с полками.", "доставка DPD,B2B", "50,100", 1),
    ("led-lumiq", "lumiq", "lighting", "LED панель Lumiq 60x60", "Ровный офисный свет.", "энергоэффективно,опт", "100,100", 1),
  ]
  variations = [
    ("drill-2ah", "drill-bg18", "BG18-2A", "18V, 2Ah", 149, 118),
    ("drill-4ah", "drill-bg18", "BG18-4A", "18V, 4Ah", 189, 151),
    ("scanner-usb", "scanner-m2", "NS-M2-USB", "USB", 89, 68),
    ("scanner-bt", "scanner-m2", "NS-M2-BT", "Bluetooth", 119, 94),
    ("glasses-one", "glasses-clear", "SP-CLEAR-1", "1 шт.", 12.9, 8.4),
    ("glasses-box", "glasses-clear", "SP-CLEAR-24", "короб 24 шт.", 249, 172),
    ("printer-basic", "printer-lp420", "LP-420-B", "Basic", 219, 176),
    ("printer-wifi", "printer-lp420", "LP-420-W", "Wi-Fi", 269, 218),
    ("shelf-180", "shelf-storeflex", "SF-180-90", "180 x 90 см", 98, 76),
    ("led-4000k", "led-lumiq", "LQ-6060-4K", "4000K", 38, 29),
    ("led-3000k", "led-lumiq", "LQ-6060-3K", "3000K", 39, 30),
  ]
  stock = [
    ("drill-2ah", "BG-2406-01", 94, 19, 120, 76, 4.2, 1.8, 21, 1, "на складе"),
    ("drill-4ah", "BG-2406-04", 37, 8, 60, 99, 5.2, 2.1, 21, 1, "на складе"),
    ("scanner-usb", "NS-2405-11", 126, 31, 180, 41, 2.2, 0.8, 21, 1, "на складе"),
    ("scanner-bt", "NS-2406-14", 48, 12, 90, 58, 2.7, 1.1, 21, 1, "на складе"),
    ("glasses-one", "SP-2406-80", 820, 140, 1000, 4.9, 0.38, 0.12, 21, 1, "на складе"),
    ("glasses-box", "SP-2406-BX", 54, 10, 120, 102, 7, 1.6, 21, 1, "на складе"),
    ("printer-basic", "LP-2406-02", 32, 9, 50, 123, 6.8, 2.9, 21, 1, "на складе"),
    ("printer-wifi", "LP-2406-03", 18, 4, 40, 151, 7.4, 3.2, 21, 1, "на складе"),
    ("shelf-180", "SF-2405-10", 61, 17, 80, 49, 8.6, 1.9, 21, 1, "на складе"),
    ("led-4000k", "LQ-2406-60", 240, 46, 360, 16.7, 1.9, 0.7, 21, 1, "на складе"),
    ("led-3000k", "LQ-2406-61", 75, 14, 160, 17.1, 1.9, 0.7, 21, 1, "на складе"),
  ]
  discounts = [
    ("disc-baltgear-b2c", "BaltGear summer", "brand", "baltgear", "percent", 12, "user", 1),
    ("disc-printer-b2b", "Printer B2B bundle", "product", "printer-lp420", "fixed", 35, "b2b", 1),
    ("disc-scanner-both", "Scanner launch", "variation", "scanner-usb", "percent", 7, "both", 1),
  ]
  suppliers = [
    ("sup-nordline", "Nordline EU", "Lithuania", "invoice 15 days"),
    ("sup-baltgear", "BaltGear Logistics", "Latvia", "prepayment"),
  ]

  conn.executemany("INSERT INTO brands (id, name) VALUES (?, ?)", brands)
  conn.executemany(
    "INSERT INTO categories (id, name, parent_id, sort_order) VALUES (?, ?, ?, ?)",
    categories,
  )
  conn.executemany(
    """
    INSERT INTO products (
      id, brand_id, category_id, name, description, tags, image_slot, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
    products,
  )
  conn.executemany(
    """
    INSERT INTO product_variations (
      id, product_id, sku, name, b2c_price, b2b_price
    ) VALUES (?, ?, ?, ?, ?, ?)
    """,
    variations,
  )
  conn.executemany(
    """
    INSERT INTO stock_lots (
      variation_id, batch, physical_qty, reserved_qty, expected_qty,
      purchase_price, shipping_cost, customs_cost, vat_rate, fx_rate, eta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    stock,
  )
  conn.executemany(
    """
    INSERT INTO discounts (
      id, name, scope, target_id, type, value, audience, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
    discounts,
  )
  conn.executemany(
    "INSERT INTO suppliers (id, name, country, payment_terms) VALUES (?, ?, ?, ?)",
    suppliers,
  )
  conn.commit()
  conn.close()


if __name__ == "__main__":
  DATA.mkdir(exist_ok=True)
  create_users_db()
  create_products_db()
  print(f"created {USERS_DB}")
  print(f"created {PRODUCTS_DB}")
