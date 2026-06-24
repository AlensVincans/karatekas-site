import hashlib
import sqlite3
from pathlib import Path

from import_karate_catalog import build_products, import_rows, write_sqlite, write_ts

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
USERS_DB = DATA / "users.sqlite"


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
      "admin@karate.test",
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
      "buyer@karate.test",
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
      "Riga Karate Club",
      "club@karate.test",
      password_hash("b2b123"),
      "b2b",
      "Riga Karate Club",
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
      ("usr-b2b", "seed", "b2b club account", "2026-06-21T00:00:00Z"),
    ],
  )
  conn.commit()
  conn.close()


def create_products_db() -> None:
  items, woo_items = import_rows()
  write_sqlite(items)
  categories, products = build_products(woo_items)
  write_ts(categories, products)


if __name__ == "__main__":
  DATA.mkdir(exist_ok=True)
  create_users_db()
  create_products_db()
  print(f"created {USERS_DB}")
  print(f"created {DATA / 'products.sqlite'}")
