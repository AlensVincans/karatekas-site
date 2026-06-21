from __future__ import annotations

import json
import re
import sqlite3
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:/Users/alenv/Downloads/Sajt_karatekas kihon_price_list.xlsx")
SCHEMA = ROOT / "data" / "products.schema.sql"
DB_PATH = ROOT / "data" / "products.sqlite"
TS_PATH = ROOT / "lib" / "karate-products.ts"

sys.stdout.reconfigure(encoding="utf-8")


def clean(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    text = str(value).replace("\r\n", "\n").replace("\r", "\n").strip()
    return re.sub(r"[ \t]+", " ", text)


def number(value: Any, default: float = 0) -> float:
    if value is None or value == "":
        return default
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace(",", ".").strip()
    try:
        return float(text)
    except ValueError:
        return default


def slug(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9а-яё]+", "-", value, flags=re.IGNORECASE)
    value = value.strip("-")
    return value or "item"


def ts(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def category_name(raw: str) -> str:
    key = raw.strip().lower()
    if "protect" in key:
        return "Защита"
    if "kimono" in key or key == "gi":
        return "Кимоно"
    if "belt" in key:
        return "Пояса"
    if "punching" in key or "bag" in key:
        return "Мешки и манекены"
    if "target" in key:
        return "Лапы и макивары"

    mapping = {
        "kimono": "Кимоно",
        "gi": "Кимоно",
        "belts": "Пояса",
        "belt": "Пояса",
        "gloves": "Перчатки",
        "glove": "Перчатки",
        "protection": "Защита",
        "protectors": "Защита",
        "shin guards": "Защита ног",
        "foot protection": "Защита ног",
        "punching bags": "Мешки и манекены",
        "bags": "Мешки и манекены",
        "equipment": "Экипировка",
        "accessories": "Аксессуары",
        "training": "Тренировки",
    }
    return mapping.get(key, raw.strip().title() or "Экипировка")


def colour_name(raw: str) -> str:
    mapping = {
        "white": "белый",
        "black": "черный",
        "blue": "синий",
        "red": "красный",
        "pink": "розовый",
        "green": "зеленый",
        "yellow": "желтый",
        "orange": "оранжевый",
        "no colour": "",
        "no color": "",
    }
    key = raw.strip().lower()
    return mapping.get(key, raw.strip())


def find_header(rows: list[tuple[Any, ...]]) -> tuple[int, list[str]] | None:
    for index, row in enumerate(rows[:20]):
        headers = [clean(cell) for cell in row]
        lowered = {header.lower() for header in headers}
        if "brand" in lowered and "title" in lowered:
            return index, headers
    return None


def row_value(row: tuple[Any, ...], headers: list[str], name: str) -> Any:
    wanted = name.lower()
    for index, header in enumerate(headers):
        if header.lower() == wanted:
            return row[index] if index < len(row) else None
    return None


def unique_sku(base: str, seen: Counter[str]) -> str:
    base = base.strip() or "SKU"
    seen[base] += 1
    if seen[base] == 1:
        return base
    return f"{base}-{seen[base]}"


def unique_slug(base: str, seen: Counter[str]) -> str:
    base = slug(base)
    seen[base] += 1
    if seen[base] == 1:
        return base
    return f"{base}-{seen[base]}"


def import_rows() -> list[dict[str, Any]]:
    wb = load_workbook(SOURCE, data_only=True)
    imported_at = datetime.now(timezone.utc).isoformat()
    items: list[dict[str, Any]] = []
    seen_skus: Counter[str] = Counter()

    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        header_match = find_header(rows)
        if not header_match:
            continue

        header_index, headers = header_match
        for excel_row_number, row in enumerate(rows[header_index + 1 :], start=header_index + 2):
            if not any(cell is not None and clean(cell) != "" for cell in row):
                continue

            brand = clean(row_value(row, headers, "Brand")) or ws.title
            group = clean(row_value(row, headers, "Group")) or "Equipment"
            title = clean(row_value(row, headers, "Title"))
            description = clean(row_value(row, headers, "Description"))
            size = clean(row_value(row, headers, "Size"))
            colour = colour_name(clean(row_value(row, headers, "Colour")))
            club_price = number(row_value(row, headers, "Club Price"))
            retail_price = number(row_value(row, headers, "I-K Price"))
            stock = int(round(number(row_value(row, headers, "Stock"))))

            if not title:
                continue

            if retail_price <= 0 and club_price > 0:
                retail_price = round(club_price * 1.28, 2)
            if club_price <= 0 and retail_price > 0:
                club_price = round(retail_price * 0.78, 2)

            raw_sku = clean(row_value(row, headers, "Product code/ SKU"))
            generated = f"{slug(brand)[:4].upper()}-{slug(title)[:18].upper()}-{slug(size or colour or str(excel_row_number)).upper()}"
            sku = unique_sku(raw_sku or generated, seen_skus)

            images = [clean(row_value(row, headers, f"img{i}")) for i in range(1, 5)]
            items.append(
                {
                    "source_sheet": ws.title,
                    "brand": brand,
                    "product_group": group,
                    "category": category_name(group),
                    "sku": sku,
                    "title": title,
                    "description": description,
                    "stock": max(0, stock),
                    "size": size,
                    "colour": colour,
                    "club_price": club_price,
                    "retail_price": retail_price,
                    "images": images,
                    "imported_at": imported_at,
                }
            )

    return items


def write_sqlite(items: list[dict[str, Any]]) -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    conn.executemany(
        """
        INSERT INTO catalog_items (
          source_sheet, brand, product_group, sku, title, description, stock,
          size, colour, club_price, retail_price, image_1, image_2, image_3,
          image_4, active, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                item["source_sheet"],
                item["brand"],
                item["product_group"],
                item["sku"],
                item["title"],
                item["description"],
                item["stock"],
                item["size"],
                item["colour"],
                item["club_price"],
                item["retail_price"],
                item["images"][0],
                item["images"][1],
                item["images"][2],
                item["images"][3],
                1,
                item["imported_at"],
            )
            for item in items
        ],
    )
    conn.commit()
    conn.close()


def build_products(items: list[dict[str, Any]]) -> tuple[list[str], list[dict[str, Any]]]:
    grouped: dict[tuple[str, str, str, str], list[dict[str, Any]]] = defaultdict(list)
    visible_items = [
        item
        for item in items
        if number(item["club_price"]) > 0 or number(item["retail_price"]) > 0
    ]

    for item in visible_items:
        key = (
            item["brand"],
            item["category"],
            item["title"],
            item["description"][:160],
        )
        grouped[key].append(item)

    positions = [("0%", "0%"), ("50%", "0%"), ("100%", "0%"), ("0%", "100%"), ("50%", "100%"), ("100%", "100%")]
    categories = sorted({item["category"] for item in visible_items})
    products: list[dict[str, Any]] = []
    seen_product_ids: Counter[str] = Counter()

    for index, ((brand, category, title, description), variations) in enumerate(grouped.items()):
        deduped: dict[tuple[str, str, float, float], dict[str, Any]] = {}
        for item in variations:
            key = (
                item["size"].lower(),
                item["colour"].lower(),
                round(number(item["club_price"]), 2),
                round(number(item["retail_price"]), 2),
            )
            current = deduped.get(key)
            if current is None or item["stock"] > current["stock"]:
                deduped[key] = item

        variations = sorted(
            deduped.values(),
            key=lambda item: (item["stock"] <= 0, item["size"], item["colour"], item["sku"]),
        )
        product_id = unique_slug(f"{brand}-{title}", seen_product_ids)
        category_copy = {
            "Защита": f"{title} {brand}: защитная экипировка для тренировок, спаррингов и соревнований по карате.",
            "Кимоно": f"{title} {brand}: кимоно для карате с подбором размера и актуальными остатками.",
            "Лапы и макивары": f"{title} {brand}: инвентарь для отработки ударов и клубных тренировок.",
            "Мешки и манекены": f"{title} {brand}: оборудование для зала и регулярной ударной практики.",
            "Пояса": f"{title} {brand}: пояс для карате, экзаменов, тренировок и клубных закупок.",
        }
        product = {
            "id": product_id,
            "name": title,
            "brand": brand,
            "category": category,
            "description": category_copy.get(
                category,
                f"{title} {brand}: экипировка для тренировок и соревнований по карате.",
            ),
            "specs": sorted({value for item in variations for value in [category, item["colour"]] if value})[:4],
            "tags": [brand, category],
            "sheetX": positions[index % len(positions)][0],
            "sheetY": positions[index % len(positions)][1],
            "variations": [],
        }

        for item in variations:
            label_parts = [part for part in [item["size"], item["colour"]] if part]
            label = " / ".join(label_parts) or item["sku"]
            club_price = item["club_price"] or item["retail_price"] * 0.78
            retail_price = item["retail_price"] or club_price * 1.28
            purchase = round(club_price * 0.62, 2)
            product["variations"].append(
                {
                    "id": slug(item["sku"]),
                    "sku": item["sku"],
                    "name": label,
                    "b2c": round(retail_price, 2),
                    "b2b": round(club_price, 2),
                    "stock": {
                        "physical": item["stock"],
                        "reserved": 0,
                        "expected": 0,
                        "purchase": purchase,
                        "shipping": round(max(0.5, purchase * 0.05), 2),
                        "customs": round(max(0.15, purchase * 0.02), 2),
                        "vatRate": 21,
                        "fx": 1,
                        "lots": [
                            {
                                "batch": f"{slug(item['source_sheet']).upper()}-{slug(item['brand']).upper()}",
                                "qty": item["stock"],
                                "purchase": purchase,
                                "shipping": round(max(0.5, purchase * 0.05), 2),
                                "customs": round(max(0.15, purchase * 0.02), 2),
                                "vatRate": 21,
                                "fx": 1,
                                "eta": "на складе" if item["stock"] > 0 else "под заказ",
                            }
                        ],
                    },
                }
            )

        products.append(product)

    def product_available(product: dict[str, Any]) -> int:
        return sum(
            max(0, variation["stock"]["physical"] - variation["stock"]["reserved"])
            for variation in product["variations"]
        )

    products.sort(
        key=lambda p: (
            product_available(p) <= 0,
            p["category"],
            p["brand"],
            p["name"],
        )
    )
    return categories, products


def write_ts(categories: list[str], products: list[dict[str, Any]]) -> None:
    content = (
        "// Generated from Sajt_karatekas kihon_price_list.xlsx by scripts/import_karate_catalog.py.\n"
        "// Do not edit product rows manually; update the workbook import instead.\n\n"
        "import type { Product } from './store-data';\n\n"
        f"export const karateCategories = {ts(categories)} as const;\n\n"
        f"export const karateProducts: Product[] = {ts(products)};\n"
    )
    TS_PATH.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    if not SOURCE.exists():
        raise SystemExit(f"Workbook not found: {SOURCE}")
    items = import_rows()
    write_sqlite(items)
    categories, products = build_products(items)
    write_ts(categories, products)
    print(
        json.dumps(
            {
                "rows": len(items),
                "products": len(products),
                "categories": categories,
                "brands": sorted({item["brand"] for item in items}),
                "db": str(DB_PATH),
                "ts": str(TS_PATH),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
