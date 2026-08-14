import { describe, expect, it } from "vitest";
import { normalizeCategory, productCategories, catalogCategoryLabels, catalogFilterLabels } from "./categories";

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
