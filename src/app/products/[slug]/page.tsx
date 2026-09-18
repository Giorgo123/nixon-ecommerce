import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductActions from "@/components/product/ProductActions";
import ProductGallery from "@/components/product/ProductGallery";
import Accordion from "@/components/product/Accordion";
import TrustBox from "@/components/product/TrustBox";
import ShareButtons from "@/components/product/ShareButtons";
import { safeJsonLd } from "@/lib/utils";
import CrossSell from "@/components/product/CrossSell";
import InstallmentsInfo from "@/components/payments/InstallmentsInfo";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/catalog";
import { catalogCategoryLabels } from "@/lib/categories";
import { buildCrossSell } from "@/lib/product-filter";
import {
  isSizedCategory,
  SHIPPING_RETURNS_COPY,
  PAYMENT_METHODS_COPY,
  getMaterialsCopy,
  getCareCopy,
} from "@/lib/constants/commerce-copy";
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

  const metaDescription = product.seo || product.description;

  return {
    title: `${product.name} — Nixon Studio`,
    description: metaDescription,
    openGraph: {
      title: product.name,
      description: metaDescription,
      images: [product.image, ...product.images].map(absoluteImageUrl),
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
    image: [product.image, ...product.images].map(absoluteImageUrl),
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
  const [product, allProducts] = await Promise.all([
    getCatalogProductBySlug(slug),
    getCatalogProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nixonstudio.com.ar";
  const price = product.price.toLocaleString("es-AR");
  const categoryLabel =
    catalogCategoryLabels[product.category] ?? product.category;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isSized = isSizedCategory(product.category);

  const isOnSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const discountPct = isOnSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const materialsCopy = getMaterialsCopy(product);
  const careCopy = getCareCopy(product);

  const crossSellProducts = buildCrossSell(product, allProducts);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd(product, totalStock)) }}
      />
      <div className="mb-8">
        <Link
          href="/products"
          className="text-sm font-medium text-nixon-muted transition-colors hover:text-nixon-ink"
        >
          ← Volver al catálogo
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <ProductGallery
          images={[product.image, ...product.images]}
          videoUrl={product.videoUrl}
          alt={product.name}
        />

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-nixon-crimson-bright">
              {categoryLabel}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-nixon-ink sm:text-4xl">
              {product.name}
            </h1>
            <p className="whitespace-pre-line text-base leading-7 text-nixon-ink-dim">
              {product.description}
            </p>
          </div>

          <div className="rounded-2xl border border-nixon-border bg-nixon-surface p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-black text-nixon-ink">
                    ${price}
                  </p>
                  {isOnSale && (
                    <>
                      <p className="text-lg text-nixon-muted line-through">
                        ${product.compareAtPrice!.toLocaleString("es-AR")}
                      </p>
                      <span className="rounded bg-nixon-crimson px-2 py-0.5 text-xs font-bold uppercase text-white">
                        -{discountPct}%
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-emerald-400">
                  Precio especial por Transferencia
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-nixon-muted">
                  Disponibilidad
                </p>
                <p className="text-lg font-semibold text-nixon-ink">
                  {totalStock > 0 ? `${totalStock} disponibles` : "A pedido"}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                Financiación
              </p>
              <InstallmentsInfo amount={product.price} variant="detailed" />
            </div>
          </div>

          <ProductActions product={product} />

          <TrustBox />

          <div className="border-t border-nixon-border">
            {(materialsCopy || careCopy) && (
              <Accordion title={isSized ? "Composición y cuidados" : "Materiales y terminación"}>
                {materialsCopy && <p>{materialsCopy}</p>}
                {careCopy && <p className="mt-2">{careCopy}</p>}
              </Accordion>
            )}
            <Accordion title="Devoluciones y envíos">
              <p>{SHIPPING_RETURNS_COPY}</p>
            </Accordion>
            <Accordion title="Métodos de pago">
              <p>{PAYMENT_METHODS_COPY}</p>
            </Accordion>
          </div>

          <ShareButtons url={`${siteUrl}/products/${product.slug}`} title={product.name} />
        </div>
      </div>

      <CrossSell products={crossSellProducts} />
    </main>
  );
}
