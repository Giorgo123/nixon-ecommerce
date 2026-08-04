import { createHmac, timingSafeEqual } from "crypto";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta configurar SESSION_SECRET");
  }
  return secret;
}

export function createOrderAccessToken(orderId: string) {
  return createHmac("sha256", getSecret()).update(orderId).digest("hex");
}

export function verifyOrderAccessToken(orderId: string, token: string | null | undefined) {
  if (!token) return false;

  const expected = createOrderAccessToken(orderId);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(token, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
