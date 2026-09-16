import { beforeEach, describe, expect, it, vi } from "vitest";
import { CouponError } from "@/lib/coupon";

const productVariant = {
  findMany: vi.fn(),
  updateMany: vi.fn(),
};
const coupon = {
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
};
const orderModel = {
  findMany: vi.fn(),
  create: vi.fn(),
};
type MockTx = { productVariant: typeof productVariant; coupon: typeof coupon; order: typeof orderModel };
const tx: MockTx = { productVariant, coupon, order: orderModel };

vi.mock("@/lib/prisma", () => ({
  default: {
    productVariant,
    coupon,
    order: orderModel,
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: MockTx) => unknown)(tx);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  },
}));

// email.ts es un no-op sin RESEND_API_KEY, no hace falta mockearlo.

const { createPendingOrder, StockError, OrderValidationError } = await import("@/lib/order");

const baseCustomer = {
  fullName: "Ana García",
  email: "ana@example.com",
  phone: "3535000000",
  deliveryMethod: "shipping" as const,
  address: "Calle Falsa 123",
  city: "Villa María",
  state: "Córdoba",
  zipCode: "5900",
};

const fakeVariant = {
  id: "variant-1",
  size: "M",
  color: null,
  stock: 10,
  product: {
    id: "product-1",
    name: "Remera Oversize",
    description: "desc",
    image: "/img.jpg",
    category: "remera",
    price: 5000,
  },
};

describe("createPendingOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderModel.findMany.mockResolvedValue([]); // sin ordenes "pending" vencidas
    orderModel.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      id: "order-1",
      ...data,
      items: [],
    }));
  });

  it("rechaza un nombre vacío sin tocar la base", async () => {
    await expect(
      createPendingOrder({ customer: { ...baseCustomer, fullName: "" }, items: [] })
    ).rejects.toBeInstanceOf(OrderValidationError);
    expect(orderModel.create).not.toHaveBeenCalled();
  });

  it("rechaza un email inválido", async () => {
    await expect(
      createPendingOrder({ customer: { ...baseCustomer, email: "no-es-email" }, items: [] })
    ).rejects.toBeInstanceOf(OrderValidationError);
  });

  it("exige dirección completa cuando el envío es a domicilio", async () => {
    await expect(
      createPendingOrder({
        customer: { ...baseCustomer, address: undefined, deliveryMethod: "shipping" },
        items: [],
      })
    ).rejects.toBeInstanceOf(OrderValidationError);
  });

  it("no exige dirección cuando es retiro en el local", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      createPendingOrder({
        customer: { ...baseCustomer, deliveryMethod: "pickup", address: undefined, city: undefined, state: undefined, zipCode: undefined },
        items: [{ variantId: "variant-1", quantity: 1 }],
      })
    ).resolves.toBeDefined();
  });

  it("rechaza el checkout si un producto del carrito ya no existe", async () => {
    productVariant.findMany.mockResolvedValue([]); // no matchea variant-1

    await expect(
      createPendingOrder({ customer: baseCustomer, items: [{ variantId: "variant-1", quantity: 1 }] })
    ).rejects.toBeInstanceOf(StockError);
  });

  it("rechaza el checkout si el decremento atómico de stock falla (carrera concurrente)", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      createPendingOrder({ customer: baseCustomer, items: [{ variantId: "variant-1", quantity: 1 }] })
    ).rejects.toBeInstanceOf(StockError);
  });

  it("crea una orden de Mercado Pago con status 'pending' por default", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 1 });

    const order = await createPendingOrder({
      customer: baseCustomer,
      items: [{ variantId: "variant-1", quantity: 2 }],
    });

    expect(orderModel.create).toHaveBeenCalledTimes(1);
    const createArgs = orderModel.create.mock.calls[0][0];
    expect(createArgs.data.paymentMethod).toBe("mercadopago");
    expect(createArgs.data.status).toBe("pending");
    expect(createArgs.data.totalPrice).toBe(10000); // 5000 * 2
    expect(order.id).toBe("order-1");
  });

  it("crea una orden por transferencia con status 'pending_transfer'", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 1 });

    await createPendingOrder({
      customer: { ...baseCustomer, paymentMethod: "transfer" },
      items: [{ variantId: "variant-1", quantity: 1 }],
    });

    const createArgs = orderModel.create.mock.calls[0][0];
    expect(createArgs.data.paymentMethod).toBe("transfer");
    expect(createArgs.data.status).toBe("pending_transfer");
  });

  it("rechaza un cupón inexistente", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 1 });
    coupon.findUnique.mockResolvedValue(null);

    await expect(
      createPendingOrder({
        customer: baseCustomer,
        items: [{ variantId: "variant-1", quantity: 1 }],
        couponCode: "NOEXISTE",
      })
    ).rejects.toBeInstanceOf(CouponError);
  });

  it("rechaza un cupón que ya alcanzó el límite de usos (chequeo atómico)", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 1 });
    coupon.findUnique.mockResolvedValue({
      id: "coupon-1",
      code: "PROMO10",
      type: "percentage",
      value: 10,
      maxUses: 5,
      usedCount: 5,
      expiresAt: null,
      active: true,
    });

    await expect(
      createPendingOrder({
        customer: baseCustomer,
        items: [{ variantId: "variant-1", quantity: 1 }],
        couponCode: "promo10",
      })
    ).rejects.toBeInstanceOf(CouponError);
  });

  it("aplica el descuento del cupón al total de la orden", async () => {
    productVariant.findMany.mockResolvedValue([fakeVariant]);
    productVariant.updateMany.mockResolvedValue({ count: 1 });
    coupon.findUnique.mockResolvedValue({
      id: "coupon-1",
      code: "PROMO10",
      type: "percentage",
      value: 10,
      maxUses: null,
      usedCount: 0,
      expiresAt: null,
      active: true,
    });
    coupon.update.mockResolvedValue({});

    await createPendingOrder({
      customer: baseCustomer,
      items: [{ variantId: "variant-1", quantity: 1 }], // subtotal 5000
      couponCode: "promo10",
    });

    const createArgs = orderModel.create.mock.calls[0][0];
    expect(createArgs.data.discountAmount).toBe(500); // 10% de 5000
    expect(createArgs.data.totalPrice).toBe(4500);
    expect(createArgs.data.couponCode).toBe("PROMO10");
  });
});
