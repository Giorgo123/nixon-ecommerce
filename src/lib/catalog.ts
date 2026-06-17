import productsData from "@/data/products.json";
import type { Product } from "@/features/products/types";

type CatalogData = {
  products: Product[];
};

const catalog = productsData as CatalogData;

export function getCatalogProducts() {
  return catalog.products;
}

export function getCatalogProductBySlug(slug: string) {
  return catalog.products.find((product) => product.slug === slug) ?? null;
}

export function getCatalogCategories() {
  return Array.from(new Set(catalog.products.map((product) => product.category)));
}

export const catalogCategoryLabels: Record<string, string> = {
  all: "Todos",
  remera: "Remeras",
  oversize: "Oversize",
  buzo: "Buzos",
  taza: "Tazas personalizadas",
  poster: "Posters de aluminio",
};
