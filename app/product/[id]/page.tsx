import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ProductCard } from "../../../components/product-card";
import {
  available,
  eur,
  findProduct,
  margin,
  pricedVariation,
  products,
  unitCost,
} from "../../../lib/store-data";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = findProduct(id);

  if (!product) {
    notFound();
  }

  const firstVariation = product.variations[0];
  const userPrice = pricedVariation(product, firstVariation, "user");
  const b2bPrice = pricedVariation(product, firstVariation, "b2b");

  return (
    <section className="section-shell">
      <div className="product-detail">
        <div
          className="product-photo detail-photo"
          style={{
            "--sheet-x": product.sheetX,
            "--sheet-y": product.sheetY,
          } as CSSProperties}
        />
        <div className="detail-copy">
          <span className="eyebrow">{product.brand}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-prices">
            <div>
              <span>B2C</span>
              <strong>{eur(userPrice.final)}</strong>
            </div>
            <div>
              <span>B2B после входа</span>
              <strong>{eur(b2bPrice.final)}</strong>
            </div>
          </div>
          <div className="spec-list">
            {product.specs.map((spec) => (
              <span key={spec}>{spec}</span>
            ))}
          </div>
          <Link className="wide-button inline-button" href="/catalog">
            Купить в каталоге
          </Link>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Вариация</th>
              <th>SKU</th>
              <th>B2C</th>
              <th>B2B</th>
              <th>Доступно</th>
              <th>Партия</th>
              <th>Себестоимость</th>
              <th>Маржа B2B</th>
            </tr>
          </thead>
          <tbody>
            {product.variations.map((variation) => (
              <tr key={variation.id}>
                <td>{variation.name}</td>
                <td>{variation.sku}</td>
                <td>{eur(variation.b2c)}</td>
                <td>{eur(variation.b2b)}</td>
                <td>{available(variation.stock)}</td>
                <td>{variation.stock.lots[0]?.batch ?? "-"}</td>
                <td>{eur(unitCost(variation.stock))}</td>
                <td>{eur(margin(variation.b2b, variation.stock))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-heading">
        <h2>Похожие товары</h2>
      </div>
      <div className="product-grid">
        {products
          .filter((item) => item.category === product.category && item.id !== product.id)
          .slice(0, 2)
          .map((item) => (
            <ProductCard key={item.id} product={item} role="user" />
          ))}
      </div>
    </section>
  );
}
