import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// El webhook cruza tres límites externos: Prisma, email y Mercado Pago. Se
// mockean los tres (igual que checkout/preference/route.test.ts) y se deja
// `@/lib/order-status` real, que es donde vive la tabla de mapeo que este test
// quiere proteger. La firma HMAC se calcula de verdad: es la guarda de entrada
// y mockearla escondería el único camino que valida el request.
const order = {
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  default: { order },
}));

const releaseOrderReservationMock = vi.fn();
const reReserveOrderMock = vi.fn();

vi.mock("@/lib/order", () => ({
  releaseOrderReservation: releaseOrderReservationMock,
  reReserveOrder: reReserveOrderMock,
}));

const sendPaymentConfirmedEmailMock = vi.fn();
const sendStockConflictAlertEmailMock = vi.fn();

vi.mock("@/lib/email", () => ({
  sendPaymentConfirmedEmail: sendPaymentConfirmedEmailMock,
  sendStockConflictAlertEmail: sendStockConflictAlertEmailMock,
}));

const fetchMock = vi.fn();

const { POST } = await import("./route");

const WEBHOOK_SECRET = "test-webhook-secret";
const ORDER_ID = "order-1";
const PAYMENT_ID = "pay-1";

function existingOrder(status: string) {
  return {
    id: ORDER_ID,
    status,
    email: "ana@example.com",
    fullName: "Ana García",
    totalPrice: 5000,
    deliveryMethod: "shipping",
    paymentMethod: "mercadopago",
    couponCode: null,
    discountAmount: 0,
    address: "Calle Falsa 123",
    city: "Villa María",
    state: "Córdoba",
    zipCode: "5900",
    items: [],
  };
}

function makeRequest() {
  const requestId = "req-1";
  const ts = "123";
  const manifest = `id:${PAYMENT_ID};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");

  return new NextRequest(`http://localhost/api/webhooks/mercadopago?data.id=${PAYMENT_ID}`, {
    method: "POST",
    body: JSON.stringify({ data: { id: PAYMENT_ID } }),
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId,
      "x-signature": `ts=${ts},v1=${v1}`,
    },
  });
}

function paymentResponse(status: string) {
  return {
    ok: true,
    json: async () => ({
      id: PAYMENT_ID,
      status,
      external_reference: ORDER_ID,
    }),
  } as unknown as Response;
}

// Recorre las escrituras reales a la orden para comprobar que nunca se
// persiste un estado crudo de Mercado Pago ("in_process", "rejected", etc.).
function writtenStatuses(): unknown[] {
  const updateManyCalls = order.updateMany.mock.calls as Array<[
    { data?: { status?: unknown } },
  ]>;
  const updateCalls = order.update.mock.calls as Array<[{ data?: { status?: unknown } }]>;

  return [...updateManyCalls, ...updateCalls]
    .map(([args]) => args.data?.status)
    .filter((status) => status !== undefined);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;

  fetchMock.mockResolvedValue(paymentResponse("approved"));
  order.findUnique.mockResolvedValue(existingOrder("pending"));
  order.updateMany.mockResolvedValue({ count: 1 });
  order.update.mockResolvedValue({});
  releaseOrderReservationMock.mockResolvedValue({ released: true });
  reReserveOrderMock.mockResolvedValue(null);
  sendPaymentConfirmedEmailMock.mockResolvedValue(undefined);
  sendStockConflictAlertEmailMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
});

describe("POST /api/webhooks/mercadopago — transiciones", () => {
  it("approved sobre pending pasa a paid y envía un email", async () => {
    order.findUnique
      .mockResolvedValueOnce(existingOrder("pending"))
      .mockResolvedValueOnce(existingOrder("paid"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID, status: { in: ["pending", "pending_transfer"] } },
      data: { status: "paid", paymentId: PAYMENT_ID },
    });
    expect(sendPaymentConfirmedEmailMock).toHaveBeenCalledTimes(1);
    expect(sendPaymentConfirmedEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: ORDER_ID, status: "paid" })
    );
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
    expect(reReserveOrderMock).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });

  it("approved repetido sobre paid no reenvía email ni mueve stock/cupón", async () => {
    order.findUnique.mockResolvedValue(existingOrder("paid"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(order.update).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
    expect(reReserveOrderMock).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });

  it("no envía email si otro proceso reclamó la orden pendiente antes (count 0)", async () => {
    order.findUnique.mockResolvedValue(existingOrder("pending"));
    order.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(order.updateMany).toHaveBeenCalledTimes(1);
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
  });

  it("rejected sobre paid no degrada la orden", async () => {
    order.findUnique.mockResolvedValue(existingOrder("paid"));
    fetchMock.mockResolvedValue(paymentResponse("rejected"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(order.update).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
    expect(writtenStatuses()).toEqual([]);
  });

  it("refunded sobre paid actualiza a refunded sin liberar stock ni cupón", async () => {
    order.findUnique.mockResolvedValue(existingOrder("paid"));
    fetchMock.mockResolvedValue(paymentResponse("refunded"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { status: "refunded", paymentId: PAYMENT_ID },
    });
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
  });

  it("rejected sobre pending libera la reserva como cancelled y persiste el paymentId", async () => {
    order.findUnique.mockResolvedValue(existingOrder("pending"));
    fetchMock.mockResolvedValue(paymentResponse("rejected"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith(ORDER_ID, "cancelled");
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { paymentId: PAYMENT_ID },
    });
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
    expect(writtenStatuses()).not.toContain("rejected");
  });

  it("in_process sobre pending persiste pending, nunca el estado crudo", async () => {
    order.findUnique.mockResolvedValue(existingOrder("pending"));
    fetchMock.mockResolvedValue(paymentResponse("in_process"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { status: "pending", paymentId: PAYMENT_ID },
    });
    expect(writtenStatuses()).toEqual(["pending"]);
  });

  it("approved sobre expired revive con re-reserva y avisa el conflicto de stock", async () => {
    const revived = existingOrder("paid_stock_conflict");
    order.findUnique.mockResolvedValue(existingOrder("expired"));
    reReserveOrderMock.mockResolvedValue({ order: revived, stockConflict: true });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).toHaveBeenCalledWith(ORDER_ID, PAYMENT_ID);
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).toHaveBeenCalledWith(revived);
    expect(sendStockConflictAlertEmailMock).toHaveBeenCalledWith(revived);
  });

  it("approved sobre expired con stock suficiente revive como paid sin alerta", async () => {
    const revived = existingOrder("paid");
    order.findUnique.mockResolvedValue(existingOrder("expired"));
    reReserveOrderMock.mockResolvedValue({ order: revived, stockConflict: false });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(sendPaymentConfirmedEmailMock).toHaveBeenCalledWith(revived);
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
  });

  it("approved sobre expired sin poder re-reservar no envía email", async () => {
    order.findUnique.mockResolvedValue(existingOrder("expired"));
    reReserveOrderMock.mockResolvedValue(null);

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).toHaveBeenCalledWith(ORDER_ID, PAYMENT_ID);
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
  });

  it("approved sobre refunded no revive, no mueve stock y no envía email", async () => {
    order.findUnique.mockResolvedValue(existingOrder("refunded"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
    expect(order.updateMany).not.toHaveBeenCalled();
  });

  it("si el claim de pending devuelve 0 y la orden quedó cancelled, re-reserva y avisa", async () => {
    const revived = existingOrder("paid_stock_conflict");
    order.findUnique
      .mockResolvedValueOnce(existingOrder("pending"))
      .mockResolvedValueOnce(existingOrder("cancelled"));
    order.updateMany.mockResolvedValue({ count: 0 });
    reReserveOrderMock.mockResolvedValue({ order: revived, stockConflict: true });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).toHaveBeenCalledWith(ORDER_ID, PAYMENT_ID);
    expect(sendPaymentConfirmedEmailMock).toHaveBeenCalledWith(revived);
    expect(sendStockConflictAlertEmailMock).toHaveBeenCalledWith(revived);
  });

  it("no hace nada si el claim devuelve 0 y otro webhook ya dejó la orden pagada", async () => {
    order.findUnique
      .mockResolvedValueOnce(existingOrder("pending"))
      .mockResolvedValueOnce(existingOrder("paid"));
    order.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
  });

  it("pending sobre pending_transfer sólo actualiza el paymentId y conserva el TTL de 72 h", async () => {
    order.findUnique.mockResolvedValue(existingOrder("pending_transfer"));
    fetchMock.mockResolvedValue(paymentResponse("pending"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { paymentId: PAYMENT_ID },
    });
    expect(writtenStatuses()).toEqual([]);
  });

  it("un estado de pago desconocido no toca la orden", async () => {
    fetchMock.mockResolvedValue(paymentResponse("some_new_mp_status"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(order.findUnique).not.toHaveBeenCalled();
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(order.update).not.toHaveBeenCalled();
    expect(sendPaymentConfirmedEmailMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mercadopago — guardas de entrada", () => {
  it("responde 401 y no consulta el pago si la firma no coincide", async () => {
    const request = new NextRequest(
      `http://localhost/api/webhooks/mercadopago?data.id=${PAYMENT_ID}`,
      {
        method: "POST",
        body: JSON.stringify({ data: { id: PAYMENT_ID } }),
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "req-1",
          "x-signature": "ts=123,v1=deadbeef",
        },
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(order.findUnique).not.toHaveBeenCalled();
  });

  it("responde 500 genérico si no se puede consultar el pago, sin filtrar el error interno", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false } as unknown as Response);

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Webhook error" });
    expect(JSON.stringify(body)).not.toContain("No se pudo consultar el pago");
    expect(order.findUnique).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
