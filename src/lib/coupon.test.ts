import { describe, expect, it } from "vitest";
import {
  assertCouponUsable,
  computeDiscount,
  normalizeCouponCode,
  allocateDiscountedUnitPrices,
  CouponError,
  type CouponLike,
} from "./coupon";

function makeCoupon(overrides: Partial<CouponLike> = {}): CouponLike {
  return {
    code: "VERANO10",
    type: "percentage",
    value: 10,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    active: true,
    ...overrides,
  };
}

describe("normalizeCouponCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeCouponCode("  verano10  ")).toBe("VERANO10");
  });
});

describe("assertCouponUsable", () => {
  it("does not throw for a valid active coupon", () => {
    expect(() => assertCouponUsable(makeCoupon())).not.toThrow();
  });

  it("throws for an inactive coupon", () => {
    expect(() => assertCouponUsable(makeCoupon({ active: false }))).toThrow(CouponError);
  });

  it("throws for an expired coupon", () => {
    const coupon = makeCoupon({ expiresAt: new Date("2020-01-01") });
    expect(() => assertCouponUsable(coupon, new Date("2026-01-01"))).toThrow(CouponError);
  });

  it("does not throw when expiresAt is in the future", () => {
    const coupon = makeCoupon({ expiresAt: new Date("2030-01-01") });
    expect(() => assertCouponUsable(coupon, new Date("2026-01-01"))).not.toThrow();
  });

  it("throws when usedCount reached maxUses", () => {
    const coupon = makeCoupon({ maxUses: 5, usedCount: 5 });
    expect(() => assertCouponUsable(coupon)).toThrow(CouponError);
  });

  it("does not throw when usedCount is below maxUses", () => {
    const coupon = makeCoupon({ maxUses: 5, usedCount: 4 });
    expect(() => assertCouponUsable(coupon)).not.toThrow();
  });

  it("does not throw when maxUses is null (unlimited)", () => {
    const coupon = makeCoupon({ maxUses: null, usedCount: 9999 });
    expect(() => assertCouponUsable(coupon)).not.toThrow();
  });
});

describe("computeDiscount", () => {
  it("computes a percentage discount", () => {
    expect(computeDiscount({ type: "percentage", value: 10 }, 1000)).toBe(100);
  });

  it("computes a fixed discount", () => {
    expect(computeDiscount({ type: "fixed", value: 300 }, 1000)).toBe(300);
  });

  it("caps a fixed discount at the subtotal (never goes negative)", () => {
    expect(computeDiscount({ type: "fixed", value: 5000 }, 1000)).toBe(1000);
  });

  it("caps a percentage discount at the subtotal", () => {
    expect(computeDiscount({ type: "percentage", value: 150 }, 1000)).toBe(1000);
  });

  it("returns 0 for a zero or negative subtotal", () => {
    expect(computeDiscount({ type: "fixed", value: 100 }, 0)).toBe(0);
    expect(computeDiscount({ type: "percentage", value: 10 }, -50)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(computeDiscount({ type: "percentage", value: 33.333 }, 100)).toBe(33.33);
  });
});

describe("allocateDiscountedUnitPrices", () => {
  function totalOf(lines: Array<{ price: number; quantity: number }>, unitPrices: number[]) {
    return unitPrices.reduce((sum, price, i) => sum + price * lines[i].quantity, 0);
  }

  it("returns the original prices when there is no discount", () => {
    const lines = [{ price: 4500, quantity: 1 }];
    expect(allocateDiscountedUnitPrices(lines, 0)).toEqual([4500]);
  });

  it("splits an even discount proportionally across two equal-priced lines", () => {
    const lines = [
      { price: 1000, quantity: 1 },
      { price: 1000, quantity: 1 },
    ];
    const result = allocateDiscountedUnitPrices(lines, 200);
    expect(result).toEqual([900, 900]);
  });

  it("makes the total charged match subtotal - discountAmount exactly (rounding remainder absorbed by the last line)", () => {
    const lines = [
      { price: 100, quantity: 1 },
      { price: 100, quantity: 1 },
      { price: 100, quantity: 1 },
    ];
    const discount = 100; // 33.33 c/u en teoria, no divide exacto
    const result = allocateDiscountedUnitPrices(lines, discount);
    const subtotal = totalOf(lines, lines.map((l) => l.price));
    expect(totalOf(lines, result)).toBeCloseTo(subtotal - discount, 2);
  });

  it("handles a line with quantity > 1 correctly", () => {
    const lines = [{ price: 500, quantity: 4 }];
    const result = allocateDiscountedUnitPrices(lines, 800); // 800 / 4 = 200 por unidad
    expect(result).toEqual([300]);
    expect(totalOf(lines, result)).toBe(2000 - 800);
  });

  it("never produces a total below zero even with a full discount", () => {
    const lines = [
      { price: 1000, quantity: 1 },
      { price: 500, quantity: 2 },
    ];
    const subtotal = 2000;
    const result = allocateDiscountedUnitPrices(lines, subtotal);
    expect(totalOf(lines, result)).toBeCloseTo(0, 2);
  });
});
