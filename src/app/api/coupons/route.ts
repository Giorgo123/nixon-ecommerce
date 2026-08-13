import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminSessionActive } from "@/lib/admin-session";
import { normalizeCouponCode } from "@/lib/coupon";

export async function GET() {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.code || !data.type || data.value === undefined) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    if (!["percentage", "fixed"].includes(data.type)) {
      return NextResponse.json({ error: "Tipo de cupón inválido" }, { status: 400 });
    }

    const value = parseFloat(data.value);
    if (Number.isNaN(value) || value <= 0) {
      return NextResponse.json({ error: "El valor debe ser un número mayor a 0" }, { status: 400 });
    }
    if (data.type === "percentage" && value > 100) {
      return NextResponse.json({ error: "Un porcentaje no puede ser mayor a 100" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizeCouponCode(data.code),
        type: data.type,
        value,
        maxUses: data.maxUses ? parseInt(data.maxUses, 10) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        active: true,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 409 });
    }
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Error creando el cupón" }, { status: 500 });
  }
}
