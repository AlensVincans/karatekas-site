import { notFound } from "next/navigation";
import { ProductDetail } from "../../../components/product-detail";
import { getProduct, listProducts } from "../../../lib/products-store";

export async function generateStaticParams() {
  const products = await listProducts();

  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
