"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/features/products/types";
import { catalogFilterLabels, normalizeCategory } from "@/lib/categories";
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
  "w-full rounded-xl border border-nixon-border bg-nixon-surface px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted focus:border-nixon-crimson-bright focus:outline-none";

export default function ProductCatalog({ products, categories: baseCategories }: ProductCatalogProps) {
  const searchParams = useSearchParams();

  // Deep-link desde el dropdown "Catálogo" del navbar (/products?category=...):
  // se lee una sola vez como estado inicial, sin useEffect, para no disparar
  // un segundo render. Mismo patrón que "search" más abajo.
  const [activeCategory, setActiveCategory] = useState(() => {
    const category = searchParams.get("category");
    return category ? normalizeCategory(category) : "all";
  });
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

  // Solo cuenta lo que vive dentro del panel de filtros (no el buscador, que
  // siempre está visible arriba) — así el número en "Filtros" del botón
  // mobile refleja exactamente lo que se despliega al tocarlo.
  const panelFilterCount = [activeCategory !== "all", minPrice !== "", maxPrice !== "", size !== null, onSaleOnly].filter(
    Boolean
  ).length;

  function clearFilters() {
    setActiveCategory("all");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSize(null);
    setOnSaleOnly(false);
  }

  const sidebar = (
    <div className="space-y-7">
      <div className="space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nixon-muted">
          Categoría
        </span>
        <div className="flex flex-col gap-0.5">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-current={isActive ? "true" : undefined}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "font-semibold text-nixon-crimson-bright"
                    : "text-nixon-ink-dim hover:text-nixon-ink",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                    isActive ? "bg-nixon-crimson-bright" : "bg-transparent",
                  ].join(" ")}
                />
                {catalogFilterLabels[category] ?? category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 border-t border-nixon-border pt-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nixon-muted">
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
                aria-pressed={isActive}
                className={[
                  "flex h-10 min-w-10 items-center justify-center rounded-md border px-2.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-nixon-crimson-bright bg-nixon-crimson-bright text-white"
                    : "border-nixon-border text-nixon-ink-dim hover:border-nixon-ink-dim",
                ].join(" ")}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 border-t border-nixon-border pt-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nixon-muted">
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
          <span className="text-nixon-muted">—</span>
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

      <label className="flex items-center gap-2 border-t border-nixon-border pt-6 text-sm text-nixon-ink-dim">
        <input
          type="checkbox"
          checked={onSaleOnly}
          onChange={(event) => setOnSaleOnly(event.target.checked)}
          className="h-4 w-4 accent-nixon-crimson-bright"
        />
        Solo ofertas (SALE)
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs font-medium text-nixon-crimson-bright hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border-b border-nixon-border pb-6 sm:flex-row sm:items-center">
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
            // min-w-0 + flex-1 + truncate: sin esto, en mobile el <select>
            // crece con el ancho de la opción elegida (ej. "Precio: mayor a
            // menor") y ese ancho + el botón "Filtros" de al lado no entran
            // en 320px, provocando overflow horizontal — solo se nota al
            // cambiar el orden, no con el valor por defecto.
            className="min-w-0 flex-1 truncate rounded-xl border border-nixon-border bg-nixon-surface px-3 py-3 text-sm text-nixon-ink focus:border-nixon-crimson-bright focus:outline-none"
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
            className="shrink-0 whitespace-nowrap rounded-xl border border-nixon-border px-4 py-3 text-sm font-semibold text-nixon-ink lg:hidden"
          >
            {filtersOpen ? "Ocultar filtros" : "Filtros"}
            {!filtersOpen && panelFilterCount > 0 ? ` (${panelFilterCount})` : ""}
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:items-start">
        <div className={`${filtersOpen ? "block" : "hidden lg:block"} lg:sticky lg:top-24`}>{sidebar}</div>

        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.15em] text-nixon-muted">
            {filteredProducts.length} producto
            {filteredProducts.length === 1 ? "" : "s"}
          </p>

          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <div className="rounded-2xl border border-nixon-border bg-nixon-surface p-8 text-center text-sm text-nixon-muted">
              <p>No encontramos productos con esos filtros.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-xs font-medium text-nixon-crimson-bright hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
