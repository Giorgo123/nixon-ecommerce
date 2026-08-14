import { describe, expect, it } from "vitest";
import { isSizedCategory, getMaterialsCopy, getCareCopy } from "./commerce-copy";

describe("isSizedCategory", () => {
  it("recognizes the canonical sized categories", () => {
    expect(isSizedCategory("remera")).toBe(true);
    expect(isSizedCategory("buzo")).toBe(true);
  });

  it("recognizes plural forms", () => {
    expect(isSizedCategory("remeras")).toBe(true);
    expect(isSizedCategory("buzos")).toBe(true);
  });

  it("recognizes the legacy 'oversize' category for backward compatibility", () => {
    expect(isSizedCategory("oversize")).toBe(true);
  });

  it("is case and whitespace insensitive", () => {
    expect(isSizedCategory("  Oversize  ")).toBe(true);
    expect(isSizedCategory("REMERA")).toBe(true);
  });

  it("returns false for categories without sizes", () => {
    expect(isSizedCategory("poster")).toBe(false);
    expect(isSizedCategory("taza")).toBe(false);
  });
});

describe("getMaterialsCopy / getCareCopy", () => {
  it("falls back to the category default when the product has no own text", () => {
    expect(getMaterialsCopy({ category: "remera" })).toContain("Algodón");
    expect(getCareCopy({ category: "remera" })).toContain("Lavar");
  });

  it("resolves the legacy 'oversize' category to the same default as 'remera'", () => {
    expect(getMaterialsCopy({ category: "oversize" })).toBe(getMaterialsCopy({ category: "remera" }));
    expect(getCareCopy({ category: "oversize" })).toBe(getCareCopy({ category: "remera" }));
  });

  it("prefers the product's own text over the category default", () => {
    expect(getMaterialsCopy({ category: "remera", materials: "Lino premium" })).toBe("Lino premium");
  });
});
