// @vitest-environment node
//
// `jose` compares the encoded secret against `Uint8Array` internally. Under the default
// jsdom test environment, `TextEncoder` produces a `Uint8Array` from jsdom's realm, which
// fails jose's `instanceof` check ("payload must be an instance of Uint8Array"). Forcing
// the Node environment for this file avoids the cross-realm mismatch.
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session-token";

const TEST_SECRET = "test-secret-para-este-archivo-solamente";

beforeEach(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
});

describe("session-token", () => {
  it("creates a token that verifies successfully right after creation", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("rejects a token that already expired", async () => {
    const expiredToken = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(TEST_SECRET));

    expect(await verifySessionToken(expiredToken)).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const tokenSignedElsewhere = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("otro-secret-completamente-distinto"));

    expect(await verifySessionToken(tokenSignedElsewhere)).toBe(false);
  });

  it("rejects an empty/undefined token", async () => {
    expect(await verifySessionToken(undefined)).toBe(false);
  });
});
