import { notFound } from "next/navigation";
import { ProductDetail } from "../../../components/product-detail";
import { findProduct, products } from "../../../lib/store-data";

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

  return <ProductDetail product={product} />;
}
