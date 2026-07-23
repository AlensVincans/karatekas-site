import { getProductImageMap } from "../../../lib/product-media-store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ images: await getProductImageMap() });
}
