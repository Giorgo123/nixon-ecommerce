"use client";

import { useMemo, useState } from "react";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/features/products/types";
import { catalogCategoryLabels } from "@/lib/categories";
import { filterProducts } from "@/lib/product-filter";

interface ProductCatalogProps {
  products: Product[];
  categories: string[];
}

export default function ProductCatalog({ products, categories: baseCategories }: ProductCatalogProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const categories = ["all", ...baseCategories];

  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        category: activeCategory,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      }),
    [products, activeCategory, search, minPrice, maxPrice]
  );

  const hasActiveFilters = activeCategory !== "all" || search.trim() !== "" || minPrice !== "" || maxPrice !== "";

  function clearFilters() {
    setActiveCategory("all");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o descripción..."
          aria-label="Buscar productos"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40"
        />

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
            Precio
          </span>
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Mínimo"
            aria-label="Precio mínimo"
            className="w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40"
          />
          <span className="text-black/40 dark:text-white/40">—</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Máximo"
            aria-label="Precio máximo"
            className="w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-red-500 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

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

      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} />
      ) : (
        <div className="rounded-2xl border border-black/10 p-8 text-center text-sm text-black/60 dark:border-white/10 dark:text-white/60">
          No encontramos productos con esos filtros.
        </div>
      )}
    </div>
  );
}
