import { beforeEach, describe, expect, it } from "vitest";
import { createOrderAccessToken, verifyOrderAccessToken } from "./order-token";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-for-vitest";
});

describe("order-token", () => {
  it("creates a token that verifies successfully for the same order id", () => {
    const token = createOrderAccessToken("order-123");
    expect(verifyOrderAccessToken("order-123", token)).toBe(true);
  });

  it("rejects a token generated for a different order id", () => {
    const token = createOrderAccessToken("order-123");
    expect(verifyOrderAccessToken("order-456", token)).toBe(false);
  });

  it("rejects a missing token", () => {
    expect(verifyOrderAccessToken("order-123", undefined)).toBe(false);
    expect(verifyOrderAccessToken("order-123", null)).toBe(false);
  });

  it("rejects a garbage token", () => {
    expect(verifyOrderAccessToken("order-123", "not-a-real-token")).toBe(false);
  });

  it("throws when SESSION_SECRET is not configured", () => {
    delete process.env.SESSION_SECRET;
    expect(() => createOrderAccessToken("order-123")).toThrow();
  });
});
