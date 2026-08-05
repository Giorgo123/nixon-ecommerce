import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductActions from "@/components/product/ProductActions";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/catalog";
import { catalogCategoryLabels } from "@/lib/categories";
import type { Product } from "@/features/products/types";

// Se revalida al instante cuando el admin crea/edita/borra este producto
// (ver revalidatePath en src/app/api/products); esto es solo un respaldo.
export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getCatalogProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

function absoluteImageUrl(image: string) {
  if (image.startsWith("http")) return image;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nixonstudio.com.ar";
  return `${siteUrl}${image}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) return {};

  return {
    title: `${product.name} — Nixon Studio`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [absoluteImageUrl(product.image)],
    },
  };
}

function productJsonLd(product: Product, totalStock: number) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nixonstudio.com.ar";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [absoluteImageUrl(product.image)],
    sku: product.id,
    category: catalogCategoryLabels[product.category] ?? product.category,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "ARS",
      price: product.price,
      availability:
        totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "ARS" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
      },
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const price = product.price.toLocaleString("es-AR");
  const categoryLabel =
    catalogCategoryLabels[product.category] ?? product.category;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, totalStock)) }}
      />
      <div className="mb-8">
        <Link
          href="/products"
          className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          ← Volver al catálogo
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black/5 dark:bg-white/5">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">
              {categoryLabel}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
              {product.name}
            </h1>
            <p className="text-base leading-7 text-black/70 dark:text-white/70">
              {product.description}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Precio
                </p>
                <p className="text-3xl font-black text-black dark:text-white">
                  ${price}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-black/60 dark:text-white/60">
                  Stock
                </p>
                <p className="text-lg font-semibold text-black dark:text-white">
                  {totalStock > 0 ? `${totalStock} disponibles` : "Agotado"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-black"
            >
              Seguir viendo
            </Link>
            <ProductActions product={product} />
          </div>

          <div className="space-y-3 text-sm text-black/60 dark:text-white/60">
            <p>Slug: {product.slug}</p>
            <p>SEO: {product.seo}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
