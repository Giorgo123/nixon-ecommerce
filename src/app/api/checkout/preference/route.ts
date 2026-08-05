import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createPendingOrder, StockError, OrderValidationError } from "@/lib/order";
import { sendOrderReceivedEmail } from "@/lib/email";
import { createOrderAccessToken } from "@/lib/order-token";

type PendingOrderItem = {
  variantId: string;
  quantity: number;
  price: number;
  variant: {
    size: string | null;
    product: {
      name: string;
      description: string;
      image: string;
      category: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN" },
        { status: 500 }
      );
    }

    const { customer, items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const order = await createPendingOrder({ customer, items });
    await sendOrderReceivedEmail(order);

    const mpItems = order.items.map((item: PendingOrderItem) => ({
      id: item.variantId,
      title: item.variant.size
        ? `${item.variant.product.name} - Talle ${item.variant.size}`
        : item.variant.product.name,
      description: item.variant.product.description,
      picture_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${item.variant.product.image}`,
      category_id: item.variant.product.category,
      quantity: item.quantity,
      currency_id: "ARS",
      unit_price: item.price,
    }));

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN ?? ""}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        items: mpItems,
        payer: {
          name: customer?.fullName,
          email: customer?.email,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/success?orderId=${order.id}&token=${createOrderAccessToken(order.id)}`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout?status=pending`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout?status=failure`,
        },
        auto_return: "approved",
        external_reference: order.id,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: "No se pudo crear la preferencia", details: errorBody },
        { status: 502 }
      );
    }

    const preference = (await response.json()) as { init_point: string };
    return NextResponse.json({ initPoint: preference.init_point });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en checkout" },
      { status: 500 }
    );
  }
}
