import prisma from "@/lib/prisma";

// Cuanto tiempo se reserva el stock de una orden "pending" antes de
// liberarse solo. 30 min: no hay un numero "oficial" que publique
// Mercado Libre/Mercado Pago, pero es el rango tipico (15-30 min) que usan
// Tiendanube/Shopify/WooCommerce para checkout sincronico. Ajustable acá.
export const PENDING_ORDER_TTL_MINUTES = 30;

const orderWithItemsInclude = {
  items: { include: { variant: { include: { product: true } } } },
} as const;

export class StockError extends Error {}

// Barrido perezoso: libera el stock de pedidos "pending" mas viejos que el
// TTL. Se llama al crear cada orden nueva en vez de depender de un cron
// (el proyecto no tiene infraestructura de jobs todavia), asi que el costo
// es proporcional a la cantidad de pedidos vencidos, normalmente 0.
export async function releaseExpiredPendingOrders() {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: { status: "pending", createdAt: { lt: cutoff } },
    include: { items: true },
  });

  for (const order of expired) {
    await prisma.$transaction([
      ...order.items.map((item) =>
        prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      ),
      prisma.order.update({ where: { id: order.id }, data: { status: "expired" } }),
    ]);
  }

  return expired.length;
}

// Libera el stock reservado por una orden puntual (usado por el boton
// "cancelar" del admin). No hace nada si la orden ya no esta "pending" —
// evita liberar dos veces si ya se libero por TTL o si ya estaba pagada.
export async function releaseOrderStock(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== "pending") return;

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}

export async function createPendingOrder(input: {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{ variantId: string; quantity: number }>;
}) {
  await releaseExpiredPendingOrders();

  return prisma.$transaction(async (tx) => {
    const variants = await tx.productVariant.findMany({
      where: { id: { in: input.items.map((item) => item.variantId) } },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const orderItemsData = [];

    for (const item of input.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new StockError("Uno de los productos del carrito ya no existe");
      }

      const decremented = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (decremented.count === 0) {
        const sizeLabel = variant.size ? ` (talle ${variant.size})` : "";
        throw new StockError(`Sin stock suficiente de "${variant.product.name}"${sizeLabel}`);
      }

      orderItemsData.push({
        quantity: item.quantity,
        price: variant.product.price,
        variantId: variant.id,
      });
    }

    const totalPrice = orderItemsData.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    return tx.order.create({
      data: {
        email: input.customer.email,
        fullName: input.customer.fullName,
        phone: input.customer.phone,
        address: input.customer.address,
        city: input.customer.city,
        state: input.customer.state,
        zipCode: input.customer.zipCode,
        totalPrice,
        status: "pending",
        items: {
          create: orderItemsData,
        },
      },
      include: orderWithItemsInclude,
    });
  });
}
