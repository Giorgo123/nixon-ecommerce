import { describe, expect, it } from "vitest";
import {
  normalizeCategory,
  productCategories,
  catalogCategoryLabels,
  catalogFilterLabels,
  categoryFromSlug,
  categorySlugs,
  slugForCategory,
} from "./categories";

describe("normalizeCategory", () => {
  it("maps the legacy 'oversize' category to 'remera'", () => {
    expect(normalizeCategory("oversize")).toBe("remera");
  });

  it("is case and whitespace insensitive", () => {
    expect(normalizeCategory("  Oversize  ")).toBe("remera");
  });

  it("passes through canonical categories unchanged (lowercased)", () => {
    expect(normalizeCategory("remera")).toBe("remera");
    expect(normalizeCategory("Buzo")).toBe("buzo");
    expect(normalizeCategory("taza")).toBe("taza");
    expect(normalizeCategory("poster")).toBe("poster");
  });
});

describe("productCategories", () => {
  it("only lists the 4 canonical categories, without the legacy 'oversize' duplicate", () => {
    expect(productCategories).toEqual(["remera", "buzo", "taza", "poster"]);
  });
});

describe("catalogCategoryLabels / catalogFilterLabels", () => {
  it("still resolves a label for the legacy 'oversize' key, same as 'remera'", () => {
    expect(catalogCategoryLabels.oversize).toBe(catalogCategoryLabels.remera);
  });

  it("filter labels cover every canonical category plus 'all'", () => {
    for (const category of ["all", ...productCategories]) {
      expect(catalogFilterLabels[category]).toBeTruthy();
    }
  });
});

describe("slugForCategory / categoryFromSlug", () => {
  it("usa 'remeras-oversize' como slug canonico de remera (incluye el alias legado)", () => {
    expect(slugForCategory("remera")).toBe("remeras-oversize");
    expect(slugForCategory("oversize")).toBe("remeras-oversize");
  });

  it("resuelve el slug de vuelta a la categoria canonica", () => {
    expect(categoryFromSlug("remeras-oversize")).toBe("remera");
    expect(categoryFromSlug("buzos")).toBe("buzo");
    expect(categoryFromSlug("tazas-personalizadas")).toBe("taza");
    expect(categoryFromSlug("posters-aluminio")).toBe("poster");
  });

  it("es tolerante a mayusculas y espacios", () => {
    expect(categoryFromSlug("  REMERAS-OVERSIZE ")).toBe("remera");
  });

  it("devuelve null para un slug desconocido (la pagina responde 404)", () => {
    expect(categoryFromSlug("no-existe")).toBeNull();
    expect(categoryFromSlug("remera")).toBeNull();
  });

  it("no colisiona con la ruta /products: los slugs viven bajo /categoria/", () => {
    for (const slug of Object.values(categorySlugs)) {
      expect(slug).not.toBe("products");
      expect(slug).not.toContain("/");
    }
  });

  it("tiene un slug unico por cada categoria canonica", () => {
    const slugs = productCategories.map((category) => slugForCategory(category));
    expect(slugs.every((slug) => slug !== null)).toBe(true);
    expect(new Set(slugs).size).toBe(productCategories.length);
  });
});
