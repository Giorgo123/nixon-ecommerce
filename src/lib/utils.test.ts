import { describe, expect, it } from "vitest";
import { cn, slugify } from "./utils";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Remera Oversize Dark Art")).toBe("remera-oversize-dark-art");
  });

  it("strips accents", () => {
    expect(slugify("Buzo Algodón Ñandú")).toBe("buzo-algodon-nandu");
  });

  it("collapses repeated separators and trims leading/trailing dashes", () => {
    expect(slugify("  --Taza!! Personalizada??--  ")).toBe("taza-personalizada");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});
