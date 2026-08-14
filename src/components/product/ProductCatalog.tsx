"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/features/products/types";
import { catalogFilterLabels } from "@/lib/categories";
import { filterProducts, type SortOption } from "@/lib/product-filter";

interface ProductCatalogProps {
  products: Product[];
  categories: string[];
}

const SIZES = ["S", "M", "L", "XL", "XXL"];

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Más nuevo",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
};

const inputClasses =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40";

export default function ProductCatalog({ products, categories: baseCategories }: ProductCatalogProps) {
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState("all");
  // Deep-link desde el buscador del navbar (/products?search=...): se lee
  // una sola vez como estado inicial, sin useEffect, para no disparar un
  // segundo render.
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = ["all", ...baseCategories];

  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        category: activeCategory,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        size,
        onSaleOnly,
        sort,
      }),
    [products, activeCategory, search, minPrice, maxPrice, size, onSaleOnly, sort]
  );

  const hasActiveFilters =
    activeCategory !== "all" || search.trim() !== "" || minPrice !== "" || maxPrice !== "" || size !== null || onSaleOnly;

  function clearFilters() {
    setActiveCategory("all");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSize(null);
    setOnSaleOnly(false);
  }

  const sidebar = (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Categoría
        </span>
        <div className="flex flex-col gap-2">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={[
                  "rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all",
                  isActive
                    ? "border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "border-black/10 bg-black/5 text-black hover:border-red-500/50 hover:bg-red-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white",
                ].join(" ")}
              >
                {catalogFilterLabels[category] ?? category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Talle
        </span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const isActive = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(isActive ? null : s)}
                className={[
                  "flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-all",
                  isActive
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-black/10 text-black hover:border-red-500/50 dark:border-white/10 dark:text-white",
                ].join(" ")}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Precio
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Mínimo"
            aria-label="Precio mínimo"
            className={inputClasses}
          />
          <span className="text-black/40 dark:text-white/40">—</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Máximo"
            aria-label="Precio máximo"
            className={inputClasses}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-black dark:text-white">
        <input
          type="checkbox"
          checked={onSaleOnly}
          onChange={(event) => setOnSaleOnly(event.target.checked)}
          className="h-4 w-4 accent-red-500"
        />
        Solo ofertas (SALE)
      </label>

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
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o descripción..."
          aria-label="Buscar productos"
          className={`flex-1 ${inputClasses}`}
        />
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            aria-label="Ordenar por"
            className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-black focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white"
          >
            {(Object.entries(SORT_LABELS) as Array<[SortOption, string]>).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="whitespace-nowrap rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-black dark:border-white/10 dark:text-white lg:hidden"
          >
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className={filtersOpen ? "block" : "hidden lg:block"}>{sidebar}</div>

        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
            <p>
              {filteredProducts.length} producto
              {filteredProducts.length === 1 ? "" : "s"} en esta vista
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
      </div>
    </div>
  );
}
