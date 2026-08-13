import type { Product } from "@/features/products/types";

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const category = filters.category ?? "all";
  const query = (filters.search ?? "").trim().toLowerCase();
  const min = filters.minPrice ?? null;
  const max = filters.maxPrice ?? null;

  return products.filter((product) => {
    if (category !== "all" && product.category !== category) return false;

    if (query) {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (min !== null && !Number.isNaN(min) && product.price < min) return false;
    if (max !== null && !Number.isNaN(max) && product.price > max) return false;

    return true;
  });
}
