import prisma from "@/lib/prisma";
import { assertCouponUsable, computeDiscount, normalizeCouponCode, CouponError } from "@/lib/coupon";
import { sendAbandonedCartEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validations";

// Cuanto tiempo se reserva el stock de una orden "pending" antes de
// liberarse solo. 30 min: no hay un numero "oficial" que publique
// Mercado Libre/Mercado Pago, pero es el rango tipico (15-30 min) que usan
// Tiendanube/Shopify/WooCommerce para checkout sincronico. Ajustable acá.
export const PENDING_ORDER_TTL_MINUTES = 30;

const orderWithItemsInclude = {
  items: { include: { variant: { include: { product: true } } } },
} as const;

export class StockError extends Error {}
export class OrderValidationError extends Error {}

// Barrido perezoso: libera el stock de pedidos "pending" mas viejos que el
// TTL. Se llama al crear cada orden nueva en vez de depender de un cron
// (el proyecto no tiene infraestructura de jobs todavia), asi que el costo
// es proporcional a la cantidad de pedidos vencidos, normalmente 0.
export async function releaseExpiredPendingOrders() {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: { status: "pending", createdAt: { lt: cutoff } },
    include: orderWithItemsInclude,
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

    await sendAbandonedCartEmail(order);
  }

  return expired.length;
}

const RELEASABLE_STATUSES = ["pending", "pending_transfer"];

// Libera el stock reservado por una orden puntual (usado por el boton
// "cancelar" del admin). No hace nada si la orden ya no esta en un estado
// "pendiente" (pending o pending_transfer) — evita liberar dos veces si ya
// se libero por TTL o si ya estaba pagada/cancelada.
export async function releaseOrderStock(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || !RELEASABLE_STATUSES.includes(order.status)) return;

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
    deliveryMethod: "shipping" | "pickup";
    paymentMethod?: "mercadopago" | "transfer";
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  items: Array<{ variantId: string; quantity: number }>;
  couponCode?: string;
}) {
  const { fullName, email, phone } = input.customer;
  if (!fullName?.trim() || fullName.trim().length < 2) {
    throw new OrderValidationError("Falta el nombre completo");
  }
  if (!email || !isValidEmail(email)) {
    throw new OrderValidationError("El email no es válido");
  }
  if (!phone?.trim() || phone.trim().length < 6) {
    throw new OrderValidationError("Falta un teléfono de contacto válido");
  }

  if (input.customer.deliveryMethod === "shipping") {
    const { address, city, state, zipCode } = input.customer;
    if (!address || !city || !state || !zipCode) {
      throw new OrderValidationError("Falta la dirección de envío");
    }
  }

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

      // La tienda funciona a pedido: no se bloquea la compra por falta de
      // stock cargado, se descuenta igual (puede quedar negativo, que es la
      // señal de "hay que reponer/fabricar N unidades" para quien prepara el
      // pedido) en vez de rechazar el checkout. Sigue siendo un updateMany
      // atomico por id para no correr una condicion de carrera con otro
      // checkout concurrente sobre el mismo variant.
      const decremented = await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });

      if (decremented.count === 0) {
        throw new StockError(`Uno de los productos del carrito ya no existe`);
      }

      orderItemsData.push({
        quantity: item.quantity,
        price: variant.product.price,
        variantId: variant.id,
      });
    }

    const subtotal = orderItemsData.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    let discountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (input.couponCode) {
      const code = normalizeCouponCode(input.couponCode);
      const coupon = await tx.coupon.findUnique({ where: { code } });

      if (!coupon) {
        throw new CouponError(`El cupón "${code}" no existe`);
      }

      assertCouponUsable(coupon);

      // Update condicional atomico (igual patron que el stock): evita que
      // dos checkouts concurrentes lean el mismo usedCount y ambos pasen el
      // limite de usos antes de que ninguno haya confirmado.
      if (coupon.maxUses !== null) {
        const consumed = await tx.coupon.updateMany({
          where: { id: coupon.id, usedCount: { lt: coupon.maxUses } },
          data: { usedCount: { increment: 1 } },
        });
        if (consumed.count === 0) {
          throw new CouponError(`El cupón "${code}" alcanzó el límite de usos`);
        }
      } else {
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      discountAmount = computeDiscount(coupon, subtotal);
      appliedCouponCode = coupon.code;
    }

    const totalPrice = subtotal - discountAmount;
    const paymentMethod = input.customer.paymentMethod ?? "mercadopago";

    return tx.order.create({
      data: {
        email: input.customer.email,
        fullName: input.customer.fullName,
        phone: input.customer.phone,
        deliveryMethod: input.customer.deliveryMethod,
        address: input.customer.address ?? null,
        city: input.customer.city ?? null,
        state: input.customer.state ?? null,
        zipCode: input.customer.zipCode ?? null,
        paymentMethod,
        couponCode: appliedCouponCode,
        discountAmount,
        totalPrice,
        // Las ordenes por transferencia no pasan por Mercado Pago, asi que
        // no tienen el TTL de 30 min (releaseExpiredPendingOrders solo mira
        // status="pending"): la transferencia puede tardar mas y el admin
        // las confirma a mano cuando ve el dinero acreditado.
        status: paymentMethod === "transfer" ? "pending_transfer" : "pending",
        items: {
          create: orderItemsData,
        },
      },
      include: orderWithItemsInclude,
    });
  });
}
