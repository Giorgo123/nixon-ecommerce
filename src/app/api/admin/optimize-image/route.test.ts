import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// isAdminSessionActive toca cookies()/jose por debajo — se mockea igual
// que Prisma en order.test.ts, no hace falta ejercitar la sesión real acá,
// esta ruta ya confía en el mismo helper que usa el resto del admin.
const isAdminSessionActiveMock = vi.fn();
vi.mock("@/lib/admin-session", () => ({
  isAdminSessionActive: isAdminSessionActiveMock,
}));

// putImage/del son el límite externo real (Vercel Image Optimization +
// storage) — se mockean, no se ejercitan de verdad, mismo criterio que
// "email.ts es un no-op, no hace falta mockearlo" en order.test.ts pero al
// revés: acá sí pega a un servicio externo real, así que sí se mockea.
const putImageMock = vi.fn();
const delMock = vi.fn();
class FakeBlobError extends Error {}
vi.mock("@vercel/blob", () => ({
  putImage: putImageMock,
  del: delMock,
  BlobError: FakeBlobError,
}));

const { POST } = await import("./route");

const OWN_BLOB_URL = "https://abc123.public.blob.vercel-storage.com/products/raw-uuid.png";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/optimize-image", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isAdminSessionActiveMock.mockResolvedValue(true);
  delMock.mockResolvedValue(undefined);
});

describe("POST /api/admin/optimize-image", () => {
  it("rechaza sin sesión admin activa", async () => {
    isAdminSessionActiveMock.mockResolvedValue(false);

    const response = await POST(makeRequest({ url: OWN_BLOB_URL }));

    expect(response.status).toBe(401);
    expect(putImageMock).not.toHaveBeenCalled();
  });

  it("rechaza una URL que no es de nuestro propio storage de Blob (evita usar la ruta como proxy de fetch)", async () => {
    const response = await POST(
      makeRequest({ url: "https://evil.example.com/steal-me.png" })
    );

    expect(response.status).toBe(400);
    expect(putImageMock).not.toHaveBeenCalled();
  });

  it("rechaza un body sin url", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(putImageMock).not.toHaveBeenCalled();
  });

  it("optimiza una imagen válida: llama a putImage con los parámetros configurados y borra la cruda", async () => {
    putImageMock.mockResolvedValue({
      url: "https://abc123.public.blob.vercel-storage.com/products/optimized-uuid.webp",
      contentType: "image/webp",
    });

    const response = await POST(makeRequest({ url: OWN_BLOB_URL }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.optimized).toBe(true);
    expect(payload.url).toBe(
      "https://abc123.public.blob.vercel-storage.com/products/optimized-uuid.webp"
    );

    expect(putImageMock).toHaveBeenCalledTimes(1);
    const [pathname, sourceUrl, options] = putImageMock.mock.calls[0];
    expect(pathname).toMatch(/^products\/.+\.webp$/);
    expect(sourceUrl).toBeInstanceOf(URL);
    expect(sourceUrl.toString()).toBe(OWN_BLOB_URL);
    expect(options).toEqual({
      access: "public",
      optimizeImage: { width: 2400, quality: 82, format: "webp" },
    });

    expect(delMock).toHaveBeenCalledWith(OWN_BLOB_URL);
  });

  it("se salta la optimización para GIF (evita aplanar una animación) sin llamar a putImage", async () => {
    const response = await POST(makeRequest({ url: OWN_BLOB_URL, contentType: "image/gif" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.optimized).toBe(false);
    expect(payload.url).toBe(OWN_BLOB_URL);
    expect(putImageMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
  });

  it("si putImage falla (archivo no era una imagen real pese al Content-Type declarado), borra el blob crudo inválido y responde 400", async () => {
    putImageMock.mockRejectedValue(new FakeBlobError("not a valid image"));

    const response = await POST(makeRequest({ url: OWN_BLOB_URL }));

    expect(response.status).toBe(400);
    expect(delMock).toHaveBeenCalledWith(OWN_BLOB_URL);
  });
});
