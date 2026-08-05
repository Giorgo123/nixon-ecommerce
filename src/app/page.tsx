import Link from "next/link";
import HeroSection from "@/components/hero/HeroSection";
import ProductGrid from "@/components/product/ProductGrid";
import { getCatalogProducts } from "@/lib/catalog";

// Se revalida al instante cuando el admin crea/edita/borra un producto
// (ver revalidatePath en src/app/api/products); esto es solo un respaldo.
export const revalidate = 300;

export default async function Home() {
  const products = await getCatalogProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <HeroSection />

      <section id="featured" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
            Productos Destacados
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Descubre nuestras remeras y prendas exclusivas
          </p>
        </div>

        {featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay productos disponibles
            </p>
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
          >
            Ver Todo el Catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
