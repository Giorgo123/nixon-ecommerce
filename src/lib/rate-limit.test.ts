import { describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit and blocks the next one", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, 5, 60_000);
    expect(checkRateLimit(keyA, 5, 60_000)).toBe(false);
    expect(checkRateLimit(keyB, 5, 60_000)).toBe(true);
  });

  it("resets the count after the window expires", () => {
    const key = `reset-${Math.random()}`;
    expect(checkRateLimit(key, 1, 10)).toBe(true);
    expect(checkRateLimit(key, 1, 10)).toBe(false);
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, 1, 10)).toBe(true);
        resolve(undefined);
      }, 20);
    });
  });
});

describe("getClientIp", () => {
  it("reads the first IP from x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to unknown when the header is missing", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });
});
