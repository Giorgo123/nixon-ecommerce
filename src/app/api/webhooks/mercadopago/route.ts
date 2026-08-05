import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { sendPaymentConfirmedEmail, sendStockConflictAlertEmail } from "@/lib/email";

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
    const orderId = payment.external_reference;

    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ ok: true });
    }

    const isApproved = payment.status === "approved";
    const alreadyPaid = existingOrder.status === "paid" || existingOrder.status === "paid_stock_conflict";

    let order;
    let stockConflict = false;

    if (isApproved && existingOrder.status === "expired") {
      // El TTL ya liberó este stock (el pago tardó más de lo esperado).
      // Intentamos re-reservarlo; si no alcanza, igual confirmamos el pago
      // — nunca se ignora un cobro real — y queda marcado para revisar.
      stockConflict = await prisma.$transaction(async (tx) => {
        let conflict = false;
        for (const item of existingOrder.items) {
          const res = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (res.count === 0) conflict = true;
        }
        return conflict;
      });

      order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: stockConflict ? "paid_stock_conflict" : "paid",
          paymentId: payment.id,
        },
        include: orderWithItemsInclude,
      });
    } else {
      const newStatus = isApproved ? "paid" : payment.status;
      order = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus, paymentId: payment.id },
        include: orderWithItemsInclude,
      });
    }

    if (isApproved && !alreadyPaid) {
      await sendPaymentConfirmedEmail(order);
      if (stockConflict) {
        await sendStockConflictAlertEmail(order);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 500 }
    );
  }
}
