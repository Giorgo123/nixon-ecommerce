import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getActiveCategoryCounts, getCatalogProducts } from "@/lib/catalog";
import {
  catalogCategoryLabels,
  categoryFromSlug,
  normalizeCategory,
  slugForCategory,
} from "@/lib/categories";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { safeJsonLd } from "@/lib/utils";
import type { Product } from "@/features/products/types";

// Igual que /products y la PDP: se revalida al instante cuando el admin
// crea/edita/borra un producto (revalidatePath en src/app/api/products).
export const revalidate = 300;

// Solo se generan paginas para categorias con al menos un producto activo
// (ver getActiveCategoryCounts). Hoy eso es unicamente "remera". Una categoria
// sin productos NO se prerenderiza ni se enlaza: no creamos paginas
// indexables vacias (thin content).
export async function generateStaticParams() {
  const categories = await getActiveCategoryCounts();
  return categories.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) return {};

  const label = catalogCategoryLabels[category] ?? category;
  return {
    title: label,
    description: `${label} de Nixon Studio. Envío gratis a todo el país y cuotas sin interés con tarjetas participantes.`,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: {
      title: `${label} — Nixon Studio`,
      description: `${label} de Nixon Studio. Envío gratis a todo el país.`,
    },
  };
}

function itemListJsonLd(products: Product[], label: string, slug: string) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: label,
    url: absoluteUrl(`/categoria/${slug}`),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/products/${product.slug}`,
      name: product.name,
    })),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryFromSlug(slug);

  // Slug desconocido O categoria sin slug propio -> 404. No se listan
  // categorias vacias ni se cae al catalogo: la URL debe ser honesta.
  if (!category || slugForCategory(category) !== slug) {
    notFound();
  }

  const [products, activeCategories] = await Promise.all([
    getCatalogProducts(),
    getActiveCategoryCounts(),
  ]);

  const categoryProducts = products.filter(
    (product) => normalizeCategory(product.category) === category
  );

  // Defensa: si la categoria quedo sin productos despues del build (todos los
  // productos desactivados), no servimos una grilla vacia -> 404. Asi la URL
  // nunca queda indexada como pagina sin contenido.
  if (categoryProducts.length === 0) {
    notFound();
  }

  const label = catalogCategoryLabels[category] ?? category;
  const isCurrentActive = activeCategories.some((entry) => entry.slug === slug);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd(categoryProducts, label, slug)) }}
      />

      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Catálogo", path: "/products" },
          { name: label, path: `/categoria/${slug}` },
        ]}
      />

      <div className="mb-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          Categoría
        </p>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl lg:text-5xl">
          {label}
        </h1>
        <p className="max-w-2xl text-sm text-black/70 dark:text-white/70 sm:text-base">
          {categoryProducts.length} producto{categoryProducts.length === 1 ? "" : "s"} en{" "}
          {label.toLowerCase()}. Envío gratis a todo el país y cuotas sin interés con
          tarjetas participantes, calculadas en vivo con Mercado Pago.
        </p>
      </div>

      <ProductGrid products={categoryProducts} />

      {/* Enlace a la categoria activa: solo aparece si de hecho hay productos
          (nunca se enlaza a una pagina vacia). Hoy /products sigue siendo la
          vista con filtros/busqueda; esta es la URL canonica por categoria. */}
      {isCurrentActive && (
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-block rounded-lg bg-black px-8 py-3 font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Ver todo el catálogo con filtros
          </Link>
        </div>
      )}
    </main>
  );
}
