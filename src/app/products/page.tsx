import ProductCatalog from "@/components/product/ProductCatalog";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-static";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getCatalogProducts(),
    getCatalogCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          Catálogo
        </p>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl lg:text-5xl">
          Colección completa
        </h1>
        <p className="max-w-2xl text-sm text-black/70 dark:text-white/70 sm:text-base">
          Explorá el catálogo local con filtros por categoría y abrí cada prenda
          para ver su detalle.
        </p>
      </div>

      <ProductCatalog products={products} categories={categories} />
    </main>
  );
}
