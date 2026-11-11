import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// La ruta crea la orden, llama a Mercado Pago y compensa si la preferencia no
// devuelve un link. Se mockean los límites externos (base de datos, email,
// rate limit y token) y `fetch`, igual que en optimize-image/route.test.ts:
// acá no se ejercita Prisma ni la red real, solo el flujo de compensación.
const createPendingOrderMock = vi.fn();
const releaseOrderReservationMock = vi.fn();
const sendOrderReceivedEmailMock = vi.fn();
const checkRateLimitMock = vi.fn();
const getClientIpMock = vi.fn();
const createOrderAccessTokenMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/order", () => ({
  createPendingOrder: createPendingOrderMock,
  releaseOrderReservation: releaseOrderReservationMock,
  StockError: class StockError extends Error {},
  OrderValidationError: class OrderValidationError extends Error {},
}));

vi.mock("@/lib/email", () => ({
  sendOrderReceivedEmail: sendOrderReceivedEmailMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIp: getClientIpMock,
}));

vi.mock("@/lib/order-token", () => ({
  createOrderAccessToken: createOrderAccessTokenMock,
}));

const { POST } = await import("./route");

const SITE_URL = "https://nixonstudio.com.ar";
const INIT_POINT = "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123";
const BLOB_URL = "https://abc123.public.blob.vercel-storage.com/products/remera.jpg";

function makeOrder(image: string) {
  return {
    id: "order-1",
    discountAmount: 0,
    items: [
      {
        variantId: "variant-1",
        quantity: 1,
        price: 5000,
        variant: {
          size: "M",
          product: {
            name: "Remera Oversize",
            description: "desc",
            image,
            category: "remera",
          },
        },
      },
    ],
  };
}

function makeRequest() {
  return new NextRequest("http://localhost/api/checkout/preference", {
    method: "POST",
    body: JSON.stringify({
      customer: {
        fullName: "Ana García",
        email: "ana@example.com",
        phone: "3535000000",
      },
      items: [{ variantId: "variant-1", quantity: 1 }],
    }),
    headers: { "Content-Type": "application/json" },
  });
}

function okResponse(payload: unknown) {
  return { ok: true, json: async () => payload } as unknown as Response;
}

function errorResponse(details = "bad gateway") {
  return {
    ok: false,
    status: 500,
    text: async () => details,
  } as unknown as Response;
}

function sentBody() {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);

  process.env.MERCADOPAGO_ACCESS_TOKEN = "test-token";
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;

  getClientIpMock.mockReturnValue("1.2.3.4");
  checkRateLimitMock.mockReturnValue(true);
  createOrderAccessTokenMock.mockReturnValue("access-token");
  createPendingOrderMock.mockResolvedValue(makeOrder("/img.jpg"));
  releaseOrderReservationMock.mockResolvedValue({ released: true });
  sendOrderReceivedEmailMock.mockResolvedValue(undefined);
  fetchMock.mockResolvedValue(okResponse({ init_point: INIT_POINT }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("POST /api/checkout/preference — compensación", () => {
  it("ante un timeout de Mercado Pago libera la orden y responde 502", async () => {
    const timeout = new Error("The operation was aborted due to timeout");
    timeout.name = "TimeoutError";
    fetchMock.mockRejectedValue(timeout);

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith("order-1", "cancelled");
    expect(payload.error).toContain("no respondió a tiempo");
  });

  it("ante un error de red libera la orden y responde 502", async () => {
    fetchMock.mockRejectedValue(new Error("socket hang up"));

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith("order-1", "cancelled");
    expect(payload.error).toContain("No se pudo conectar con Mercado Pago");
  });

  it("ante una respuesta !ok libera la orden y responde 502", async () => {
    fetchMock.mockResolvedValue(errorResponse("mp down"));

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith("order-1", "cancelled");
    expect(payload).toMatchObject({ error: "No se pudo crear la preferencia", details: "mp down" });
  });

  it("si la respuesta ok no trae init_point libera la orden y responde 502", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    const response = await POST(makeRequest());

    expect(response.status).toBe(502);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith("order-1", "cancelled");
  });

  it("si init_point es una cadena vacía libera la orden y responde 502", async () => {
    fetchMock.mockResolvedValue(okResponse({ init_point: "" }));

    const response = await POST(makeRequest());

    expect(response.status).toBe(502);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith("order-1", "cancelled");
  });

  it("si init_point es válido responde 200, NO libera y envía el email de pedido recibido", async () => {
    const order = makeOrder("/img.jpg");
    createPendingOrderMock.mockResolvedValue(order);

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ initPoint: INIT_POINT });
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
    expect(sendOrderReceivedEmailMock).toHaveBeenCalledTimes(1);
    expect(sendOrderReceivedEmailMock).toHaveBeenCalledWith(order);
  });

  it("si falla el token de acceso libera la orden y responde 500 sin culpar a Mercado Pago", async () => {
    createOrderAccessTokenMock.mockImplementation(() => {
      throw new Error("Falta configurar SESSION_SECRET");
    });

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "No se pudo iniciar el checkout" });
    expect(JSON.stringify(payload)).not.toContain("Mercado Pago");
    expect(releaseOrderReservationMock).toHaveBeenCalledWith("order-1", "cancelled");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendOrderReceivedEmailMock).not.toHaveBeenCalled();
  });

  it("no compensa errores de validación previos a crear la orden", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    const response = await POST(
      new NextRequest("http://localhost/api/checkout/preference", {
        method: "POST",
        body: JSON.stringify({ customer: {}, items: [] }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(createPendingOrderMock).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });

  it("manda picture_url intacta cuando la imagen es absoluta de Blob", async () => {
    createPendingOrderMock.mockResolvedValue(makeOrder(BLOB_URL));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(sentBody().items[0].picture_url).toBe(BLOB_URL);
  });

  it("manda picture_url con el dominio cuando la imagen es relativa", async () => {
    createPendingOrderMock.mockResolvedValue(makeOrder("/img.jpg"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(sentBody().items[0].picture_url).toBe(`${SITE_URL}/img.jpg`);
  });
});
