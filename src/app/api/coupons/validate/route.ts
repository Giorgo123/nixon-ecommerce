import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertCouponUsable, computeDiscount, normalizeCouponCode, CouponError } from "@/lib/coupon";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Chequeo de solo lectura para mostrarle el descuento al cliente antes de
// pagar. No incrementa usedCount - eso pasa recien cuando la orden se crea
// de verdad, en order.ts.
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`coupon-validate:${ip}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const { code, subtotal } = (await request.json()) as { code?: string; subtotal?: number };

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const normalized = normalizeCouponCode(code);
    const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });

    if (!coupon) {
      return NextResponse.json({ error: `El cupón "${normalized}" no existe` }, { status: 404 });
    }

    assertCouponUsable(coupon);

    const discountAmount = computeDiscount(coupon, subtotal);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    });
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error validando el cupón" },
      { status: 500 }
    );
  }
}
