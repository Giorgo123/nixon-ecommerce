import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { sendPaymentConfirmedEmail, sendStockConflictAlertEmail } from "@/lib/email";
import { reReserveOrder, releaseOrderReservation } from "@/lib/order";
import { isPaidStatus, isReleasableStatus, mapMercadoPagoStatus } from "@/lib/order-status";

function isValidWebhookSignature(request: NextRequest, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(v1, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function fetchPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN ?? ""}`,
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo consultar el pago");
  }

  return response.json() as Promise<{
    id: string;
    status: string;
    external_reference?: string;
  }>;
}

const orderWithItemsInclude = {
  items: { include: { variant: { include: { product: true } } } },
} as const;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const dataId = request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id");
    const paymentId = payload?.data?.id ?? payload?.id ?? dataId;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    if (!dataId || !isValidWebhookSignature(request, dataId)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const payment = await fetchPayment(String(paymentId));

    // Traducir primero evita que un estado nuevo de Mercado Pago termine
    // escrito tal cual en `order.status`.
    const mapped = mapMercadoPagoStatus(payment.status);
    if (!mapped) {
      return NextResponse.json({ ok: true });
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return NextResponse.json({ ok: true });
    }

    // Reembolsada es terminal: no revive con un pago tardío ni acepta
    // notificaciones posteriores. La reserva de un reembolso de orden pagada
    // nunca se liberó, así que revivirla volvería a descontar stock/cupón.
    if (existing.status === "refunded") {
      return NextResponse.json({ ok: true });
    }

    // Una orden pagada no se degrada. El único cambio permitido es el
    // reembolso, que no devuelve stock: la reserva ya se consumió al pagar.
    if (isPaidStatus(existing.status)) {
      if (mapped.status === "refunded") {
        await prisma.order.updateMany({
          where: { id: orderId },
          data: { status: "refunded", paymentId: payment.id },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // La reserva ya se liberó (vencida o cancelada). Sólo un pago aprobado la
    // revive; las notificaciones tardías de otros estados no deben tocar stock
    // ni cupón. `refunded` se resolvió arriba y no revive nunca.
    if (existing.status === "cancelled" || existing.status === "expired") {
      if (mapped.status !== "paid") {
        return NextResponse.json({ ok: true });
      }

      const revived = await reReserveOrder(orderId, payment.id);
      if (!revived) {
        return NextResponse.json({ ok: true });
      }

      await sendPaymentConfirmedEmail(revived.order);
      if (revived.stockConflict) {
        await sendStockConflictAlertEmail(revived.order);
      }
      return NextResponse.json({ ok: true });
    }

    // La orden todavía tiene la reserva activa.
    if (isReleasableStatus(existing.status)) {
      if (mapped.status === "paid") {
        // Reclamo atómico: si otro webhook ya la pasó a pagada, no se duplica
        // el email ni se vuelve a mover stock/cupón.
        const claimed = await prisma.order.updateMany({
          where: { id: orderId, status: { in: ["pending", "pending_transfer"] } },
          data: { status: "paid", paymentId: payment.id },
        });

        if (claimed.count === 1) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: orderWithItemsInclude,
          });
          if (order) {
            await sendPaymentConfirmedEmail(order);
          }
          return NextResponse.json({ ok: true });
        }

        // El claim falló porque otro proceso movió la orden entre la lectura
        // y el update (por ejemplo, el barrido la venció o un admin la
        // canceló). Se re-lee para decidir: si quedó sin reserva, se revive
        // igual que un pago tardío; si ya está pagada/reembolsada, otro
        // camino ya se hizo cargo y no hay que duplicar el email.
        const latest = await prisma.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        if (latest?.status === "cancelled" || latest?.status === "expired") {
          const revived = await reReserveOrder(orderId, payment.id);
          if (revived) {
            await sendPaymentConfirmedEmail(revived.order);
            if (revived.stockConflict) {
              await sendStockConflictAlertEmail(revived.order);
            }
          }
        }
        return NextResponse.json({ ok: true });
      }

      if (mapped.releasesReservation) {
        await releaseOrderReservation(
          orderId,
          mapped.status === "refunded" ? "refunded" : "cancelled"
        );
        await prisma.order.updateMany({
          where: { id: orderId },
          data: { paymentId: payment.id },
        });
        return NextResponse.json({ ok: true });
      }

      if (mapped.status === "pending") {
        // No degradar una transferencia (72 h) al TTL corto de Mercado Pago
        // (30 min): sólo se guarda el pago, el estado se conserva.
        await prisma.order.updateMany({
          where: { id: orderId },
          data:
            existing.status === "pending_transfer"
              ? { paymentId: payment.id }
              : { status: "pending", paymentId: payment.id },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Cualquier otro estado no se degrada; sólo un reembolso puede moverlo a
    // refunded (los estados pagados ya se resolvieron arriba).
    if (mapped.status === "refunded") {
      await prisma.order.updateMany({
        where: { id: orderId },
        data: { status: "refunded", paymentId: payment.id },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Mercado Pago reintenta ante un 5xx; el detalle queda en los logs del
    // servidor, no en la respuesta.
    console.error("Error procesando el webhook de Mercado Pago", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
