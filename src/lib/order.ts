import prisma from "@/lib/prisma";
import { assertCouponUsable, computeDiscount, normalizeCouponCode, CouponError } from "@/lib/coupon";
import { sendAbandonedCartEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validations";
import { RELEASABLE_STATUSES } from "@/lib/order-status";
import { MAX_QUANTITY_PER_ITEM } from "@/store/cart.store";

export { RELEASABLE_STATUSES };

// Cuanto tiempo se reserva el stock de una orden "pending" antes de
// liberarse solo. 30 min: no hay un numero "oficial" que publique
// Mercado Libre/Mercado Pago, pero es el rango tipico (15-30 min) que usan
// Tiendanube/Shopify/WooCommerce para checkout sincronico. Ajustable acá.
export const PENDING_ORDER_TTL_MINUTES = 30;

// La transferencia se acredita a mano (el admin la confirma recién cuando ve
// el dinero en la cuenta), así que damos mucho más margen que al checkout
// sincrónico de Mercado Pago. 72 h evitan liberar el stock de una
// transferencia que todavía puede estar en camino.
export const PENDING_TRANSFER_TTL_HOURS = 72;

const orderWithItemsInclude = {
  items: { include: { variant: { include: { product: true } } } },
} as const;

export class StockError extends Error {}
export class OrderValidationError extends Error {}

// Barrido perezoso: libera el stock de pedidos pendientes mas viejos que su
// TTL. Cubre las dos cohortes: Mercado Pago ("pending", 30 min) y
// transferencia ("pending_transfer", 72 h porque se acredita a mano). Se
// llama al crear cada orden nueva en vez de depender de un cron (el proyecto
// no tiene infraestructura de jobs todavia), asi que el costo es proporcional
// a la cantidad de pedidos vencidos, normalmente 0.
//
// `now` es inyectable para testear los bordes de tiempo sin depender del reloj
// real. Devuelve cuántas órdenes se liberaron efectivamente, no cuántas se
// encontraron: otra pasada u otro proceso pudo reclamarlas entre el `findMany`
// y el helper, y esas no se cuentan ni reciben email.
export async function releaseExpiredPendingOrders(now: Date = new Date()) {
  const pendingCutoff = new Date(now.getTime() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
  const transferCutoff = new Date(now.getTime() - PENDING_TRANSFER_TTL_HOURS * 60 * 60 * 1000);

  const expired = await prisma.order.findMany({
    where: {
      OR: [
        { status: "pending", createdAt: { lt: pendingCutoff } },
        { status: "pending_transfer", createdAt: { lt: transferCutoff } },
      ],
    },
    include: orderWithItemsInclude,
  });

  let releasedCount = 0;
  for (const order of expired) {
    const { released } = await releaseOrderReservation(order.id, "expired");
    if (!released) continue;

    releasedCount += 1;
    await sendAbandonedCartEmail(order);
  }

  return releasedCount;
}

// Libera la reserva (stock + cupón) de una orden puntual. Es el único dueño
// de revertir una reserva: lo usan la cancelación administrativa, el barrido
// de vencidas, la compensación del checkout y el webhook.
//
// La idempotencia no depende de leer el estado: dentro de la transacción se
// reclama la orden con un `updateMany` condicionado a que siga en un estado
// releasable. Si `count === 0` (orden inexistente, ya pagada o ya liberada por
// otro proceso), no se toca stock ni cupón y se devuelve `released: false`.
export async function releaseOrderReservation(
  orderId: string,
  finalStatus: "cancelled" | "expired" | "refunded"
): Promise<{ released: boolean }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { released: false };

    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { in: [...RELEASABLE_STATUSES] } },
      data: { status: finalStatus },
    });
    if (claimed.count === 0) return { released: false };

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }

    if (order.couponCode) {
      // `gt: 0` evita dejar el contador en negativo. Si el cupón ya no existe
      // o estaba en cero, el update no matchea y la liberación sigue igual.
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    return { released: true };
  });
}

// Revive una orden cuya reserva ya se había liberado (vencida o cancelada)
// cuando Mercado Pago confirma un pago tarde o el admin confirma una
// transferencia. Vuelve a descontar stock y a consumir el cupón: el cobro ya
// existe y no se puede rechazar, así que si algún ítem no alcanza se confirma
// igual y queda como conflicto para revisión manual.
//
// `refunded` queda deliberadamente fuera del reclamo: un reembolso de una orden
// pagada nunca liberó stock ni cupón, así que revivirla los descontaría dos
// veces. Tampoco se re-reserva una orden ya pagada.
//
// `paymentId` es opcional: el webhook lo pasa, la confirmación manual del admin
// lo omite y conserva el que ya estaba guardado.
//
// La idempotencia la da el reclamo condicionado por estado: sólo la primera
// notificación encuentra la orden revivible. Si otro webhook ya la reclamó (o
// la orden no era revivible), `count === 0` y se devuelve `null` sin tocar
// stock, cupón ni enviar email.
export async function reReserveOrder(orderId: string, paymentId?: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["expired", "cancelled"] } },
      data: paymentId ? { status: "paid", paymentId } : { status: "paid" },
    });
    if (claimed.count === 0) return null;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: orderWithItemsInclude,
    });
    if (!order) return null;

    let stockConflict = false;
    for (const item of order.items) {
      const reserved = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (reserved.count === 0) stockConflict = true;
    }

    if (order.couponCode) {
      // Sin tope por `maxUses`: el pago ya está cobrado. Si el cupón ya no
      // existe, `updateMany` no matchea; la orden se confirma igual pero se
      // deja registro para revisar el contador a mano.
      const reconsumed = await tx.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
      if (reconsumed.count === 0) {
        console.warn("No se pudo re-consumir el cupón al re-reservar la orden", {
          orderId,
          couponCode: order.couponCode,
        });
      }
    }

    if (stockConflict) {
      const conflicted = await tx.order.update({
        where: { id: orderId },
        data: { status: "paid_stock_conflict" },
        include: orderWithItemsInclude,
      });
      return { order: conflicted, stockConflict };
    }

    return { order, stockConflict };
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

  // La cantidad viaja tal cual desde el cliente hasta el decremento de stock
  // y el cálculo del total — sin este chequeo, un negativo infla el stock
  // (decrement de un número negativo) y arma un total negativo/absurdo antes
  // de que Mercado Pago llegue a rechazar el precio.
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderValidationError("El carrito está vacío");
  }
  for (const item of input.items) {
    if (typeof item.variantId !== "string" || !item.variantId) {
      throw new OrderValidationError("Uno de los productos del carrito es inválido");
    }
    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY_PER_ITEM
    ) {
      throw new OrderValidationError(`La cantidad debe ser entre 1 y ${MAX_QUANTITY_PER_ITEM}`);
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
        // tienen su propio TTL mas largo (72 h): el admin las confirma a mano
        // cuando ve el dinero acreditado. releaseExpiredPendingOrders cubre
        // ambas cohortes con cortes distintos.
        status: paymentMethod === "transfer" ? "pending_transfer" : "pending",
        items: {
          create: orderItemsData,
        },
      },
      include: orderWithItemsInclude,
    });
  });
}
