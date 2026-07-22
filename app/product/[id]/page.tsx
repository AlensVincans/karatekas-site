import { notFound } from "next/navigation";
import { ProductDetail } from "../../../components/product-detail";
import { listProducts } from "../../../lib/products-store";
import { listPublicProducts } from "../../../lib/public-products";
import { getSessionUser } from "../../../lib/server-auth";

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
  const user = await getSessionUser();
  const products = await listPublicProducts(user);
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetail
      product={product}
      relatedProducts={products.filter(
        (item) => item.category === product.category && item.id !== product.id,
      )}
    />
  );
}
