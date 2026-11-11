import { beforeEach, describe, expect, it, vi } from "vitest";

// El PUT administrativo cruza cuatro límites externos: Prisma, la sesión de
// admin, los helpers de reserva y el email de alerta. Se mockean los cuatro y
// se deja el resto de la ruta real: lo que este test protege es la tabla de
// transiciones y el reclamo atómico, no Prisma.
const order = {
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  default: { order },
}));

const isAdminSessionActiveMock = vi.fn();

vi.mock("@/lib/admin-session", () => ({
  isAdminSessionActive: isAdminSessionActiveMock,
}));

const releaseOrderReservationMock = vi.fn();
const reReserveOrderMock = vi.fn();

vi.mock("@/lib/order", () => ({
  releaseOrderReservation: releaseOrderReservationMock,
  reReserveOrder: reReserveOrderMock,
}));

const sendStockConflictAlertEmailMock = vi.fn();

vi.mock("@/lib/email", () => ({
  sendStockConflictAlertEmail: sendStockConflictAlertEmailMock,
}));

const { PUT } = await import("./route");

const ORDER_ID = "order-1";

function currentOrder(status: string, paymentId: string | null = null) {
  return { status, paymentId };
}

function fullOrder(status: string) {
  return { id: ORDER_ID, status, items: [] };
}

function callPut(body: unknown) {
  return PUT(
    new Request(`http://localhost/api/orders/${ORDER_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: ORDER_ID }) }
  );
}

beforeEach(() => {
  vi.resetAllMocks();

  isAdminSessionActiveMock.mockResolvedValue(true);
  releaseOrderReservationMock.mockResolvedValue({ released: true });
  reReserveOrderMock.mockResolvedValue(null);
  sendStockConflictAlertEmailMock.mockResolvedValue(undefined);
  order.updateMany.mockResolvedValue({ count: 1 });
  order.update.mockResolvedValue(fullOrder("pending"));
});

describe("PUT /api/orders/[id] — autorización", () => {
  it("responde 401 sin sesión de admin y no toca la base", async () => {
    isAdminSessionActiveMock.mockResolvedValue(false);

    const response = await callPut({ status: "paid" });

    expect(response.status).toBe(401);
    expect(order.findUnique).not.toHaveBeenCalled();
  });

  it("responde 404 si la orden no existe", async () => {
    order.findUnique.mockResolvedValueOnce(null);

    const response = await callPut({ trackingInfo: "AR123" });

    expect(response.status).toBe(404);
    expect(order.update).not.toHaveBeenCalled();
  });
});

describe("PUT /api/orders/[id] — confirmar pago", () => {
  it("pending → paid reclama atómicamente sin escribir paymentId ni re-reservar", async () => {
    order.findUnique
      .mockResolvedValueOnce(currentOrder("pending"))
      .mockResolvedValueOnce(fullOrder("paid"));

    const response = await callPut({ status: "paid" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ status: "paid" }));
    expect(order.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: ORDER_ID },
      select: { status: true, paymentId: true },
    });
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID, status: { in: ["pending", "pending_transfer"] } },
      data: { status: "paid" },
    });
    expect(reReserveOrderMock).not.toHaveBeenCalled();
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
  });

  it("expired → paid re-reserva con el paymentId guardado y alerta si hay conflicto", async () => {
    const conflicted = fullOrder("paid_stock_conflict");
    order.findUnique
      .mockResolvedValueOnce(currentOrder("expired", "pay-old"))
      .mockResolvedValueOnce(conflicted);
    reReserveOrderMock.mockResolvedValue({ order: conflicted, stockConflict: true });

    const response = await callPut({ status: "paid" });

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).toHaveBeenCalledWith(ORDER_ID, "pay-old");
    expect(sendStockConflictAlertEmailMock).toHaveBeenCalledWith(conflicted);
    expect(order.updateMany).not.toHaveBeenCalled();
  });

  it("expired → paid sin poder re-reservar responde 409 sin actualizar", async () => {
    order.findUnique.mockResolvedValueOnce(currentOrder("expired"));
    reReserveOrderMock.mockResolvedValue(null);

    const response = await callPut({ status: "paid" });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "La orden cambió de estado" });
    expect(order.update).not.toHaveBeenCalled();
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
  });

  it("refunded → paid responde 409 y nunca re-reserva", async () => {
    order.findUnique.mockResolvedValueOnce(currentOrder("refunded", "pay-1"));

    const response = await callPut({ status: "paid" });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Una orden reembolsada no se puede volver a pagar",
    });
    expect(reReserveOrderMock).not.toHaveBeenCalled();
    expect(order.updateMany).not.toHaveBeenCalled();
  });

  it("si el claim devuelve 0 y la orden quedó cancelled, re-reserva con el paymentId actual", async () => {
    const revived = fullOrder("paid");
    order.findUnique
      .mockResolvedValueOnce(currentOrder("pending"))
      .mockResolvedValueOnce(currentOrder("cancelled", "pay-9"))
      .mockResolvedValueOnce(revived);
    order.updateMany.mockResolvedValue({ count: 0 });
    reReserveOrderMock.mockResolvedValue({ order: revived, stockConflict: false });

    const response = await callPut({ status: "paid" });

    expect(response.status).toBe(200);
    expect(reReserveOrderMock).toHaveBeenCalledWith(ORDER_ID, "pay-9");
    expect(sendStockConflictAlertEmailMock).not.toHaveBeenCalled();
  });
});

describe("PUT /api/orders/[id] — transiciones inválidas", () => {
  it("paid → pending responde 409 y no deja que el barrido libere stock vendido", async () => {
    order.findUnique.mockResolvedValueOnce(currentOrder("paid"));

    const response = await callPut({ status: "pending" });

    expect(response.status).toBe(409);
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(order.update).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });

  it("paid → cancelled responde 409 (se usa Reembolsada)", async () => {
    order.findUnique.mockResolvedValueOnce(currentOrder("paid"));

    const response = await callPut({ status: "cancelled" });

    expect(response.status).toBe(409);
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
    expect(order.update).not.toHaveBeenCalled();
  });

  it("refunded → cancelled responde 409 y no libera dos veces", async () => {
    order.findUnique.mockResolvedValueOnce(currentOrder("refunded"));

    const response = await callPut({ status: "cancelled" });

    expect(response.status).toBe(409);
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });

  it("pending_transfer → pending conserva pending_transfer para no acortar el TTL", async () => {
    order.findUnique
      .mockResolvedValueOnce(currentOrder("pending_transfer"))
      .mockResolvedValueOnce(fullOrder("pending_transfer"));

    const response = await callPut({ status: "pending" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ status: "pending_transfer" })
    );
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(order.update).not.toHaveBeenCalled();
  });
});

describe("PUT /api/orders/[id] — liberación y tracking", () => {
  it("pending → refunded libera una sola vez con el estado refunded", async () => {
    order.findUnique
      .mockResolvedValueOnce(currentOrder("pending"))
      .mockResolvedValueOnce(fullOrder("refunded"));

    const response = await callPut({ status: "refunded" });

    expect(response.status).toBe(200);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith(ORDER_ID, "refunded");
    expect(order.update).not.toHaveBeenCalled();
  });

  it("pending → cancelled libera con cancelled", async () => {
    order.findUnique
      .mockResolvedValueOnce(currentOrder("pending"))
      .mockResolvedValueOnce(fullOrder("cancelled"));

    const response = await callPut({ status: "cancelled" });

    expect(response.status).toBe(200);
    expect(releaseOrderReservationMock).toHaveBeenCalledWith(ORDER_ID, "cancelled");
  });

  it("paid → refunded cambia el estado sin devolver stock ni cupón", async () => {
    order.findUnique
      .mockResolvedValueOnce(currentOrder("paid"))
      .mockResolvedValueOnce(fullOrder("refunded"));
    order.update.mockResolvedValue(fullOrder("refunded"));

    const response = await callPut({ status: "refunded" });

    expect(response.status).toBe(200);
    expect(order.update).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { status: "refunded" },
    });
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });

  it("trackingInfo se actualiza sin cambiar el estado", async () => {
    order.findUnique
      .mockResolvedValueOnce(currentOrder("pending"))
      .mockResolvedValueOnce(fullOrder("pending"));
    order.update.mockResolvedValue(fullOrder("pending"));

    const response = await callPut({ trackingInfo: "AR123456789" });

    expect(response.status).toBe(200);
    expect(order.update).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { trackingInfo: "AR123456789" },
    });
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(releaseOrderReservationMock).not.toHaveBeenCalled();
  });
});
