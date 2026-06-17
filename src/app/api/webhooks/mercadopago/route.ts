import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const paymentId = payload?.data?.id ?? payload?.id;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const payment = await fetchPayment(String(paymentId));
    const orderId = payment.external_reference;

    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: payment.status === "approved" ? "paid" : payment.status,
        paymentId: payment.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 500 }
    );
  }
}
