import { describe, expect, it } from "vitest";
import { isDatabaseConnectionError } from "./db-safe";

function prismaError(message: string, code?: string) {
  const error = new Error(message);
  if (code) Object.assign(error, { code });
  return error;
}

describe("isDatabaseConnectionError", () => {
  it("detecta los fallos de conexión de Prisma por código", () => {
    expect(isDatabaseConnectionError(prismaError("algo", "P1001"))).toBe(true);
    expect(isDatabaseConnectionError(prismaError("algo", "P1002"))).toBe(true);
    expect(isDatabaseConnectionError(prismaError("algo", "P1011"))).toBe(true);
    expect(isDatabaseConnectionError(prismaError("algo", "P1017"))).toBe(true);
  });

  it("detecta los fallos de conexión por mensaje aunque venga sin código", () => {
    expect(
      isDatabaseConnectionError(
        prismaError("Invalid `prisma.product.findMany()` invocation: Can't reach database server")
      )
    ).toBe(true);
    expect(
      isDatabaseConnectionError(
        prismaError("Timed out fetching a new connection from the connection pool.")
      )
    ).toBe(true);
    expect(
      isDatabaseConnectionError(
        prismaError("Error opening a TLS connection: la conexión fue interrumpida.")
      )
    ).toBe(true);
    expect(
      isDatabaseConnectionError(prismaError("Server has closed the connection."))
    ).toBe(true);
  });

  it("no confunde otros errores de Prisma con fallos de conexión", () => {
    // P2002: unique constraint, P2025: record not found.
    expect(isDatabaseConnectionError(prismaError("Unique constraint failed", "P2002"))).toBe(false);
    expect(isDatabaseConnectionError(prismaError("Record not found", "P2025"))).toBe(false);
  });

  it("tolera valores que no son Error", () => {
    expect(isDatabaseConnectionError(null)).toBe(false);
    expect(isDatabaseConnectionError(undefined)).toBe(false);
    expect(isDatabaseConnectionError("Can't reach database server")).toBe(false);
    expect(isDatabaseConnectionError({ code: "P1001" })).toBe(false);
  });
});
