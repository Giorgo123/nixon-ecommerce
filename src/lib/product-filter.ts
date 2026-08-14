import type { Product } from "@/features/products/types";

export type SortOption = "newest" | "price-asc" | "price-desc";

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  size?: string | null;
  onSaleOnly?: boolean;
  sort?: SortOption;
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const category = filters.category ?? "all";
  const query = (filters.search ?? "").trim().toLowerCase();
  const min = filters.minPrice ?? null;
  const max = filters.maxPrice ?? null;
  const size = filters.size ?? null;

  const filtered = products.filter((product) => {
    if (category !== "all" && product.category !== category) return false;

    if (query) {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (min !== null && !Number.isNaN(min) && product.price < min) return false;
    if (max !== null && !Number.isNaN(max) && product.price > max) return false;

    if (size && !product.variants.some((variant) => variant.size === size)) return false;

    if (filters.onSaleOnly && !(product.compareAtPrice && product.compareAtPrice > product.price)) {
      return false;
    }

    return true;
  });

  return sortProducts(filtered, filters.sort ?? "newest");
}

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const sorted = [...products];

  if (sort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return sorted;
}
