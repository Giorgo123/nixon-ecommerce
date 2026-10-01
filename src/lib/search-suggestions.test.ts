import { describe, expect, it } from "vitest";
import {
  hasSearchableQuery,
  normalizeSearchText,
  rankProductSuggestions,
  scoreProduct,
  SEARCH_SUGGESTION_LIMIT,
} from "./search-suggestions";
import type { Product } from "@/features/products/types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Remera Oversize Guts de Berserk — Droop #45 Edicion 2",
    description: "Remera oversize de algodón peinado con estampa serigráfica.",
    price: 41500,
    image: "/x.webp",
    category: "remera",
    slug: "remera-oversize-guts-de-berserk-droop-45-edicion-2",
    isFeatured: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants: [],
    images: [],
    ...overrides,
  };
}

const PRODUCTS: Product[] = [
  makeProduct({ id: "1", slug: "remera-oversize-guts-de-berserk-droop-45-edicion-2" }),
  makeProduct({
    id: "2",
    name: "Remera Oversize Negra Satoru Gojo – Nixon Droop #3 Edicion Limitada",
    slug: "remera-oversize-negra-satoru-gojo-nixon-droop-3-edicion-limitada",
    category: "remera",
  }),
  makeProduct({
    id: "3",
    name: "Taza Personalizada Nixon",
    description: "Taza de ceramica con estampa.",
    category: "taza",
    slug: "taza-personalizada-nixon",
  }),
  makeProduct({
    id: "4",
    name: "Remera Oversize Mike Tyson— Droop #14 Edicion Limitada",
    description: "Algod organico 240g.",
    materials: "Algodon organico",
    slug: "remera-oversize-mike-tyson-droop-14-edicion-limitada",
    isFeatured: true,
  }),
];

describe("normalizeSearchText", () => {
  it("lowercases", () => {
    expect(normalizeSearchText("BERSERK")).toBe("berserk");
  });

  it("strips accents so unaccented queries match accented data", () => {
    expect(normalizeSearchText("Edición")).toBe("edicion");
    expect(normalizeSearchText("edicion")).toBe("edicion");
  });

  it("turns ñ into n so a query without ñ still matches", () => {
    expect(normalizeSearchText("mañana")).toBe("manana");
    expect(normalizeSearchText("manana")).toBe("manana");
  });

  it("collapses and trims whitespace", () => {
    expect(normalizeSearchText("  droop   45 ")).toBe("droop 45");
  });
});

describe("hasSearchableQuery", () => {
  it("requires at least 2 characters after trimming", () => {
    expect(hasSearchableQuery("")).toBe(false);
    expect(hasSearchableQuery("a")).toBe(false);
    expect(hasSearchableQuery(" a ")).toBe(false);
    expect(hasSearchableQuery("ab")).toBe(true);
    expect(hasSearchableQuery(" ab ")).toBe(true);
  });
});

describe("scoreProduct", () => {
  it("returns 0 for an empty query", () => {
    expect(scoreProduct(PRODUCTS[0], "   ")).toBe(0);
  });

  it("returns 0 when nothing matches", () => {
    expect(scoreProduct(PRODUCTS[0], "zzzz")).toBe(0);
  });

  it("matches name regardless of case and accents", () => {
    expect(scoreProduct(PRODUCTS[0], "BERSERK")).toBeGreaterThan(0);
    expect(scoreProduct(PRODUCTS[0], "edicion")).toBeGreaterThan(0);
    expect(scoreProduct(PRODUCTS[0], "EDICIÓN")).toBeGreaterThan(0);
  });

  it("requires every token to match (AND semantics)", () => {
    expect(scoreProduct(PRODUCTS[0], "droop 45")).toBeGreaterThan(0);
    expect(scoreProduct(PRODUCTS[0], "droop 999")).toBe(0);
  });

  it("matches category labels and descriptions", () => {
    expect(scoreProduct(PRODUCTS[2], "taza")).toBeGreaterThan(0);
    expect(scoreProduct(PRODUCTS[3], "organico")).toBeGreaterThan(0);
  });

  it("scores a name hit above a description-only hit", () => {
    const nameHit = scoreProduct(PRODUCTS[0], "berserk");
    const descriptionHit = scoreProduct(PRODUCTS[3], "serigrafica");
    expect(nameHit).toBeGreaterThan(descriptionHit);
  });

  it("prefers a name prefix over a name substring", () => {
    const prefix = scoreProduct(PRODUCTS[0], "remera");
    const substring = scoreProduct(PRODUCTS[0], "berserk");
    expect(prefix).toBeGreaterThan(substring);
  });
});

describe("rankProductSuggestions", () => {
  it("returns nothing for an empty query", () => {
    expect(rankProductSuggestions(PRODUCTS, "")).toEqual([]);
  });

  it("returns the most relevant product first", () => {
    const result = rankProductSuggestions(PRODUCTS, "berserk");
    expect(result[0].slug).toBe("remera-oversize-guts-de-berserk-droop-45-edicion-2");
  });

  it("resolves the category into a short label", () => {
    const result = rankProductSuggestions(PRODUCTS, "taza");
    expect(result[0]).toMatchObject({ slug: "taza-personalizada-nixon", category: "taza" });
    expect(result[0].categoryLabel).toBe("Tazas");
  });

  it("normalizes the legacy 'oversize' category", () => {
    const legacy = makeProduct({ id: "9", name: "Oversize Negra Touka Kirishima", category: "oversize" });
    const result = rankProductSuggestions([legacy], "remera");
    expect(result[0].category).toBe("remera");
  });

  it("only returns the fields the UI needs", () => {
    const [first] = rankProductSuggestions(PRODUCTS, "berserk");
    expect(Object.keys(first).sort()).toEqual(["category", "categoryLabel", "image", "name", "price", "slug"]);
  });

  it("caps the number of suggestions", () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      makeProduct({ id: String(index), name: `Remera Oversize Berserk ${index}` })
    );
    expect(rankProductSuggestions(many, "berserk")).toHaveLength(SEARCH_SUGGESTION_LIMIT);
  });

  it("honours a custom limit", () => {
    expect(rankProductSuggestions(PRODUCTS, "remera", 2)).toHaveLength(2);
  });
});
