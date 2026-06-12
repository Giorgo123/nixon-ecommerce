"use client";

import { useEffect, useState } from "react";
import HeroSection from "@/components/hero/HeroSection";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/features/products/types";
import { getProducts } from "@/features/products/services";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Error al cargar los productos");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // Obtener solo algunos productos destacados (primeros 4)
  const featuredProducts = products.slice(0, 4);

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products */}
      <section id="featured" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
            Productos Destacados
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Descubre nuestras remeras y prendas exclusivas
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white" />
              <p className="text-center text-gray-600 dark:text-gray-400">
                Cargando productos...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && featuredProducts.length > 0 && (
          <ProductGrid products={featuredProducts} />
        )}

        {!loading && !error && featuredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay productos disponibles
            </p>
          </div>
        )}

        {/* CTA to full catalog */}
        <div className="mt-16 text-center">
          <a
            href="/products"
            className="inline-block px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
          >
            Ver Todo el Catálogo
          </a>
        </div>
      </section>
    </main>
  );
}
