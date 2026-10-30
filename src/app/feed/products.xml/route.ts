import { getCatalogProducts } from "@/lib/catalog";
import { buildProductFeed } from "@/lib/product-feed";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nixonstudio.com.ar";
  const products = await getCatalogProducts();
  const xml = buildProductFeed(products, siteUrl);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
