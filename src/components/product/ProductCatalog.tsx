"use client";

import { useState } from "react";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/features/products/types";
import { catalogCategoryLabels, getCatalogCategories } from "@/lib/catalog";

interface ProductCatalogProps {
  products: Product[];
}

export default function ProductCatalog({ products }: ProductCatalogProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = ["all", ...getCatalogCategories()];

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "border-black/10 bg-black/5 text-black hover:border-red-500/50 hover:bg-red-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white",
              ].join(" ")}
            >
              {catalogCategoryLabels[category] ?? category}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
        <p>
          {filteredProducts.length} producto
          {filteredProducts.length === 1 ? "" : "s"} en esta vista
        </p>
        <p>
          Filtro activo: {catalogCategoryLabels[activeCategory] ?? activeCategory}
        </p>
      </div>

      <ProductGrid products={filteredProducts} />
    </div>
  );
}
