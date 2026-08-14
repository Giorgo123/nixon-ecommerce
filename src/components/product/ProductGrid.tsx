"use client";

import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/features/products/types";

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
  return (
    <section className="w-full">
      {title && (
        <h2 className="mb-8 text-3xl font-bold text-black dark:text-white">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
