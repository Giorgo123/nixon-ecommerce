import Link from "next/link";
import HeroSection from "@/components/hero/HeroSection";
import ProductGrid from "@/components/product/ProductGrid";
import ValueProps from "@/components/home/ValueProps";
import HowItWorks from "@/components/home/HowItWorks";
import InstallmentsShowcase from "@/components/home/InstallmentsShowcase";
import BrandManifesto from "@/components/home/BrandManifesto";
import Testimonials from "@/components/home/Testimonials";
import Lookbook from "@/components/home/Lookbook";
import { getCatalogProducts } from "@/lib/catalog";

// Se revalida al instante cuando el admin crea/edita/borra un producto
// (ver revalidatePath en src/app/api/products); esto es solo un respaldo.
export const revalidate = 300;

export default async function Home() {
  const products = await getCatalogProducts();
  const starProducts = products.filter((product) => product.isFeatured).slice(0, 3);
  // Si todavia no se marco ningun producto como estrella desde el admin, la
  // seccion de destacados cae a los mas recientes para no quedar vacia; el
  // slider del hero en cambio solo se muestra con productos curados.
  const featuredProducts = (products.filter((product) => product.isFeatured).length > 0
    ? products.filter((product) => product.isFeatured)
    : products
  ).slice(0, 4);
  const referenceAmount =
    products.length > 0
      ? products.reduce((sum, product) => sum + product.price, 0) / products.length
      : 0;

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <HeroSection starProducts={starProducts} />

      <ValueProps />

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

      <HowItWorks />
      <InstallmentsShowcase referenceAmount={referenceAmount} />
      <BrandManifesto />
      <Testimonials />
      <Lookbook products={products} />
    </main>
  );
}
