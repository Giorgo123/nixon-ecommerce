import { beforeEach, describe, expect, it, vi } from "vitest";

const order = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
};
const productVariant = {
  update: vi.fn(),
  updateMany: vi.fn(),
};
const coupon = {
  updateMany: vi.fn(),
};

vi.mock("@/lib/email", () => ({
  sendAbandonedCartEmail: vi.fn(),
}));

type MockTx = { order: typeof order; productVariant: typeof productVariant; coupon: typeof coupon };
const tx: MockTx = { order, productVariant, coupon };

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: MockTx) => unknown)(tx);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
    order,
    productVariant,
    coupon,
  },
}));

const {
  PENDING_TRANSFER_TTL_HOURS,
  releaseExpiredPendingOrders,
  releaseOrderReservation,
  reReserveOrder,
} = await import("@/lib/order");
const { sendAbandonedCartEmail } = await import("@/lib/email");
const sendAbandonedCartEmailMock = vi.mocked(sendAbandonedCartEmail);

const pendingOrder = {
  id: "order-1",
  status: "pending",
  couponCode: "PROMO10",
  items: [
    { variantId: "variant-1", quantity: 2 },
    { variantId: "variant-2", quantity: 1 },
  ],
};

describe("releaseOrderReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    order.updateMany.mockResolvedValue({ count: 1 });
    productVariant.update.mockResolvedValue({});
    coupon.updateMany.mockResolvedValue({ count: 1 });
  });

  it("libera stock de todos los items y decrementa el cupón cuando reclama la orden", async () => {
    order.findUnique.mockResolvedValue(pendingOrder);

    const result = await releaseOrderReservation("order-1", "cancelled");

    expect(result).toEqual({ released: true });
    expect(order.findUnique).toHaveBeenCalledWith({
      where: { id: "order-1" },
      include: { items: true },
    });
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: "order-1", status: { in: ["pending", "pending_transfer"] } },
      data: { status: "cancelled" },
    });
    expect(productVariant.update).toHaveBeenCalledTimes(2);
    expect(productVariant.update).toHaveBeenNthCalledWith(1, {
      where: { id: "variant-1" },
      data: { stock: { increment: 2 } },
    });
    expect(productVariant.update).toHaveBeenNthCalledWith(2, {
      where: { id: "variant-2" },
      data: { stock: { increment: 1 } },
    });
    expect(coupon.updateMany).toHaveBeenCalledWith({
      where: { code: "PROMO10", usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  });

  it("la segunda llamada no vuelve a liberar (el reclamo devuelve count 0)", async () => {
    order.findUnique.mockResolvedValue(pendingOrder);
    order.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const first = await releaseOrderReservation("order-1", "cancelled");
    const second = await releaseOrderReservation("order-1", "cancelled");

    expect(first).toEqual({ released: true });
    expect(second).toEqual({ released: false });
    expect(productVariant.update).toHaveBeenCalledTimes(2); // sólo la primera llamada
    expect(coupon.updateMany).toHaveBeenCalledTimes(1);
  });

  it("devuelve released:false sin tocar nada si otro proceso ya reclamó la orden", async () => {
    order.findUnique.mockResolvedValue(pendingOrder);
    order.updateMany.mockResolvedValue({ count: 0 });

    await expect(releaseOrderReservation("order-1", "expired")).resolves.toEqual({
      released: false,
    });
    expect(productVariant.update).not.toHaveBeenCalled();
    expect(coupon.updateMany).not.toHaveBeenCalled();
  });

  it("no libera una orden inexistente", async () => {
    order.findUnique.mockResolvedValue(null);

    await expect(releaseOrderReservation("missing", "cancelled")).resolves.toEqual({
      released: false,
    });
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(productVariant.update).not.toHaveBeenCalled();
    expect(coupon.updateMany).not.toHaveBeenCalled();
  });

  it.each(["paid", "paid_stock_conflict", "cancelled", "refunded", "expired"])(
    "no libera una orden %s (el reclamo por estado devuelve count 0)",
    async (status) => {
      order.findUnique.mockResolvedValue({ ...pendingOrder, status });
      order.updateMany.mockResolvedValue({ count: 0 });

      await expect(releaseOrderReservation("order-1", "cancelled")).resolves.toEqual({
        released: false,
      });
      expect(productVariant.update).not.toHaveBeenCalled();
      expect(coupon.updateMany).not.toHaveBeenCalled();
    }
  );

  it("no falla si el cupón ya no existe o está en cero (el where exige usedCount > 0)", async () => {
    order.findUnique.mockResolvedValue(pendingOrder);
    coupon.updateMany.mockResolvedValue({ count: 0 });

    await expect(releaseOrderReservation("order-1", "refunded")).resolves.toEqual({
      released: true,
    });
    expect(coupon.updateMany).toHaveBeenCalledWith({
      where: { code: "PROMO10", usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  });

  it("no toca el cupón si la orden no usó uno", async () => {
    order.findUnique.mockResolvedValue({ ...pendingOrder, couponCode: null });

    await expect(releaseOrderReservation("order-1", "cancelled")).resolves.toEqual({
      released: true,
    });
    expect(coupon.updateMany).not.toHaveBeenCalled();
  });
});

describe("reReserveOrder", () => {
  const expiredOrder = {
    ...pendingOrder,
    status: "expired",
    items: [
      { variantId: "variant-1", quantity: 2 },
      { variantId: "variant-2", quantity: 1 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    order.updateMany.mockResolvedValue({ count: 1 });
    order.findUnique.mockResolvedValue(expiredOrder);
    order.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...expiredOrder,
      ...data,
    }));
    productVariant.updateMany.mockResolvedValue({ count: 1 });
    coupon.updateMany.mockResolvedValue({ count: 1 });
  });

  it("sólo reclama órdenes expired/cancelled y persiste el paymentId", async () => {
    const result = await reReserveOrder("order-1", "pay-1");

    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({ id: "order-1" }),
        stockConflict: false,
      })
    );
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: "order-1", status: { in: ["expired", "cancelled"] } },
      data: { status: "paid", paymentId: "pay-1" },
    });
  });

  it("no revive una orden refunded: el reclamo devuelve count 0", async () => {
    order.updateMany.mockResolvedValue({ count: 0 });

    await expect(reReserveOrder("order-1", "pay-1")).resolves.toBeNull();
    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: "order-1", status: { in: ["expired", "cancelled"] } },
      data: { status: "paid", paymentId: "pay-1" },
    });
    expect(productVariant.updateMany).not.toHaveBeenCalled();
    expect(coupon.updateMany).not.toHaveBeenCalled();
  });

  it("sin paymentId actualiza sólo el estado (confirmación manual del admin)", async () => {
    await reReserveOrder("order-1");

    expect(order.updateMany).toHaveBeenCalledWith({
      where: { id: "order-1", status: { in: ["expired", "cancelled"] } },
      data: { status: "paid" },
    });
  });

  it("avisa por consola si el cupón ya no se puede re-consumir, sin bloquear el pago", async () => {
    coupon.updateMany.mockResolvedValue({ count: 0 });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await reReserveOrder("order-1", "pay-1");

    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({ id: "order-1" }),
        stockConflict: false,
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("No se pudo re-consumir el cupón"),
      expect.objectContaining({ orderId: "order-1", couponCode: "PROMO10" })
    );

    warnSpy.mockRestore();
  });
});

type SweepOrder = {
  id: string;
  status: "pending" | "pending_transfer";
  createdAt: Date;
  email: string;
  fullName: string;
  couponCode: string | null;
  items: Array<{ variantId: string; quantity: number }>;
};

type SweepWhere = {
  OR: Array<{ status: string; createdAt: { lt: Date } }>;
};

function sweepOrder(id: string, status: SweepOrder["status"], createdAt: Date): SweepOrder {
  return {
    id,
    status,
    createdAt,
    email: `${id}@example.com`,
    fullName: `Cliente ${id}`,
    couponCode: null,
    items: [{ variantId: `${id}-variant`, quantity: 1 }],
  };
}

// Emula el filtro por fecha que haría PostgreSQL: los tests construyen
// órdenes con `createdAt` y comprueban que el barrido sólo procesa las que
// cruzan el corte de su cohorte.
function mockSweepDatabase(orders: SweepOrder[], alreadyClaimed: string[] = []) {
  const claimedIds = new Set(alreadyClaimed);

  order.findMany.mockImplementation(async ({ where }: { where: SweepWhere }) =>
    orders.filter((candidate) =>
      where.OR.some(
        (condition) =>
          condition.status === candidate.status &&
          candidate.createdAt.getTime() < condition.createdAt.lt.getTime()
      )
    )
  );

  order.findUnique.mockImplementation(
    async ({ where }: { where: { id: string } }) =>
      orders.find((candidate) => candidate.id === where.id) ?? null
  );

  order.updateMany.mockImplementation(
    async ({ where }: { where: { id: string; status: { in: string[] } } }) => {
      const target = orders.find((candidate) => candidate.id === where.id);
      if (!target || !where.status.in.includes(target.status) || claimedIds.has(target.id)) {
        return { count: 0 };
      }
      claimedIds.add(target.id);
      return { count: 1 };
    }
  );
}

describe("releaseExpiredPendingOrders", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

  beforeEach(() => {
    vi.clearAllMocks();
    productVariant.update.mockResolvedValue({});
    coupon.updateMany.mockResolvedValue({ count: 1 });
    sendAbandonedCartEmailMock.mockResolvedValue(undefined);
  });

  it("libera pending de 31 min y pending_transfer de 73 h, e ignora 29 min y 71 h", async () => {
    mockSweepDatabase([
      sweepOrder("pending-31", "pending", minutesAgo(31)),
      sweepOrder("pending-29", "pending", minutesAgo(29)),
      sweepOrder("transfer-73", "pending_transfer", hoursAgo(73)),
      sweepOrder("transfer-71", "pending_transfer", hoursAgo(71)),
    ]);

    await expect(releaseExpiredPendingOrders(now)).resolves.toBe(2);

    expect(order.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { status: "pending", createdAt: { lt: minutesAgo(30) } },
          {
            status: "pending_transfer",
            createdAt: { lt: hoursAgo(PENDING_TRANSFER_TTL_HOURS) },
          },
        ],
      },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    expect(order.updateMany).toHaveBeenCalledTimes(2);
    expect(sendAbandonedCartEmailMock).toHaveBeenCalledTimes(2);
    expect(sendAbandonedCartEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pending-31" })
    );
    expect(sendAbandonedCartEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "transfer-73" })
    );
    expect(productVariant.update).toHaveBeenCalledTimes(2);
  });

  it("una segunda pasada no vuelve a liberar ni reenvía el email (reclamo count 0)", async () => {
    mockSweepDatabase([sweepOrder("pending-31", "pending", minutesAgo(31))]);

    await expect(releaseExpiredPendingOrders(now)).resolves.toBe(1);
    await expect(releaseExpiredPendingOrders(now)).resolves.toBe(0);

    expect(order.updateMany).toHaveBeenCalledTimes(2);
    expect(sendAbandonedCartEmailMock).toHaveBeenCalledTimes(1);
    expect(productVariant.update).toHaveBeenCalledTimes(1);
  });

  it("devuelve la cantidad de liberadas, no la de encontradas", async () => {
    mockSweepDatabase(
      [
        sweepOrder("pending-31", "pending", minutesAgo(31)),
        sweepOrder("pending-45", "pending", minutesAgo(45)),
      ],
      ["pending-45"] // otro proceso ya la reclamó entre el findMany y el helper
    );

    await expect(releaseExpiredPendingOrders(now)).resolves.toBe(1);

    expect(order.updateMany).toHaveBeenCalledTimes(2);
    expect(sendAbandonedCartEmailMock).toHaveBeenCalledTimes(1);
    expect(sendAbandonedCartEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pending-31" })
    );
  });
});
