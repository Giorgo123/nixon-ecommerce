import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// El endpoint cruza un único límite externo: el barrido de órdenes. Se mockea
// `@/lib/order` para poder contar las llamadas y forzar errores; la guarda
// de autorización (timing-safe, fail-closed) queda sin mockear porque es
// justamente lo que este test protege.
const releaseExpiredPendingOrdersMock = vi.fn();

vi.mock("@/lib/order", () => ({
  releaseExpiredPendingOrders: releaseExpiredPendingOrdersMock,
}));

const { GET } = await import("./route");

const CRON_SECRET = "cron-secret-de-prueba";

function makeRequest(authorization?: string) {
  return new NextRequest("http://localhost/api/cron/cleanup-orders", {
    method: "GET",
    headers: authorization ? { authorization } : undefined,
  });
}

let originalCronSecret: string | undefined;

beforeEach(() => {
  vi.resetAllMocks();
  originalCronSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = CRON_SECRET;
  releaseExpiredPendingOrdersMock.mockResolvedValue(0);
});

afterEach(() => {
  if (originalCronSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }
});

describe("GET /api/cron/cleanup-orders", () => {
  it("responde 500 y no barre si CRON_SECRET no está configurado (fail-closed)", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "CRON_SECRET no configurado" });
    expect(releaseExpiredPendingOrdersMock).not.toHaveBeenCalled();
  });

  it("responde 500 y no barre si CRON_SECRET está vacío", async () => {
    process.env.CRON_SECRET = "";

    const response = await GET(makeRequest("Bearer "));

    expect(response.status).toBe(500);
    expect(releaseExpiredPendingOrdersMock).not.toHaveBeenCalled();
  });

  it("responde 401 y no barre si falta el header Authorization", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "No autorizado" });
    expect(releaseExpiredPendingOrdersMock).not.toHaveBeenCalled();
  });

  it("responde 401 y no barre si el token es incorrecto", async () => {
    const response = await GET(makeRequest("Bearer token-equivocado"));

    expect(response.status).toBe(401);
    expect(releaseExpiredPendingOrdersMock).not.toHaveBeenCalled();
  });

  it("responde 401 y no barre si la longitud del token es distinta", async () => {
    const response = await GET(makeRequest("Bearer short"));

    expect(response.status).toBe(401);
    expect(releaseExpiredPendingOrdersMock).not.toHaveBeenCalled();
  });

  it("ejecuta el barrido una vez y devuelve el conteo con el token correcto", async () => {
    releaseExpiredPendingOrdersMock.mockResolvedValue(3);

    const response = await GET(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, released: 3 });
    expect(releaseExpiredPendingOrdersMock).toHaveBeenCalledTimes(1);
  });

  it("responde 500 sin exponer detalles si el barrido falla", async () => {
    releaseExpiredPendingOrdersMock.mockRejectedValue(new Error("boom de prisma"));

    const response = await GET(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Error al limpiar órdenes" });
    expect(JSON.stringify(body)).not.toContain("boom de prisma");
  });
});
