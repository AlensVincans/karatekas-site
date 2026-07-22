import { listPublicProducts } from "../../../lib/public-products";
import { getSessionUser } from "../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();

  return Response.json({
    products: await listPublicProducts(user),
  });
}
