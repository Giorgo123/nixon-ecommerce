import { NextRequest, NextResponse } from "next/server";
import { createPendingOrder, StockError, OrderValidationError } from "@/lib/order";
import { CouponError } from "@/lib/coupon";
import { sendOrderReceivedEmail } from "@/lib/email";
import { createOrderAccessToken } from "@/lib/order-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`checkout:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const { customer, items, couponCode } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const order = await createPendingOrder({
      customer: { ...customer, paymentMethod: "transfer" },
      items,
      couponCode,
    });
    await sendOrderReceivedEmail(order);

    return NextResponse.json({
      orderId: order.id,
      token: createOrderAccessToken(order.id),
    });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en checkout" },
      { status: 500 }
    );
  }
}
