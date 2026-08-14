import { describe, expect, it } from "vitest";
import { filterProducts } from "./product-filter";
import type { Product } from "@/features/products/types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Remera Oversize Dark Art",
    description: "Remera oversize 100% algodón",
    price: 4500,
    image: "/x.jpg",
    category: "oversize",
    slug: "remera-oversize-dark-art",
    isFeatured: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants: [],
    images: [],
    ...overrides,
  };
}

describe("filterProducts", () => {
  const products = [
    makeProduct({ id: "1", name: "Remera Oversize Dark Art", category: "oversize", price: 4500 }),
    makeProduct({ id: "2", name: "Remera Regular Blanca", category: "remera", price: 3500 }),
    makeProduct({ id: "3", name: "Taza Personalizada Nixon", description: "Taza de cerámica", category: "taza", price: 2900 }),
  ];

  it("returns everything when there are no filters", () => {
    expect(filterProducts(products, {})).toHaveLength(3);
  });

  it("filters by category", () => {
    const result = filterProducts(products, { category: "taza" });
    expect(result.map((p) => p.id)).toEqual(["3"]);
  });

  it("treats category 'all' as no filter", () => {
    expect(filterProducts(products, { category: "all" })).toHaveLength(3);
  });

  it("matches search against name case-insensitively", () => {
    const result = filterProducts(products, { search: "REMERA" });
    expect(result.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("matches search against description too", () => {
    const result = filterProducts(products, { search: "cerámica" });
    expect(result.map((p) => p.id)).toEqual(["3"]);
  });

  it("returns nothing when the search matches no product", () => {
    expect(filterProducts(products, { search: "no-existe" })).toHaveLength(0);
  });

  it("filters by minimum price (inclusive)", () => {
    const result = filterProducts(products, { minPrice: 3500 });
    expect(result.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("filters by maximum price (inclusive)", () => {
    const result = filterProducts(products, { maxPrice: 3500 });
    expect(result.map((p) => p.id).sort()).toEqual(["2", "3"]);
  });

  it("treats legacy 'oversize' category as equivalent to 'remera'", () => {
    const mixed = [
      makeProduct({ id: "1", category: "oversize" }),
      makeProduct({ id: "2", category: "remera" }),
      makeProduct({ id: "3", category: "taza" }),
    ];
    expect(filterProducts(mixed, { category: "remera" }).map((p) => p.id).sort()).toEqual(["1", "2"]);
    expect(filterProducts(mixed, { category: "oversize" }).map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("combines category, search and price range", () => {
    const result = filterProducts(products, { category: "oversize", search: "dark", minPrice: 4000, maxPrice: 5000 });
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("filters by size, matching any variant on the product", () => {
    const sized = [
      makeProduct({ id: "1", variants: [{ id: "v1", size: "M", color: null, stock: 2 }] }),
      makeProduct({ id: "2", variants: [{ id: "v2", size: "L", color: null, stock: 2 }] }),
    ];
    expect(filterProducts(sized, { size: "M" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("filters to only products with an active discount when onSaleOnly is set", () => {
    const withDiscount = [
      makeProduct({ id: "1", price: 4000, compareAtPrice: 5000 }),
      makeProduct({ id: "2", price: 4000, compareAtPrice: undefined }),
      makeProduct({ id: "3", price: 4000, compareAtPrice: 4000 }),
    ];
    expect(filterProducts(withDiscount, { onSaleOnly: true }).map((p) => p.id)).toEqual(["1"]);
  });

  it("sorts by price ascending and descending", () => {
    const asc = filterProducts(products, { sort: "price-asc" });
    expect(asc.map((p) => p.id)).toEqual(["3", "2", "1"]);

    const desc = filterProducts(products, { sort: "price-desc" });
    expect(desc.map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("sorts by newest (createdAt desc) by default", () => {
    const withDates = [
      makeProduct({ id: "old", createdAt: "2026-01-01T00:00:00.000Z" }),
      makeProduct({ id: "new", createdAt: "2026-06-01T00:00:00.000Z" }),
    ];
    expect(filterProducts(withDates, {}).map((p) => p.id)).toEqual(["new", "old"]);
  });
});
