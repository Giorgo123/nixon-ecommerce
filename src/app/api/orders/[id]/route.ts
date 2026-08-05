import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminSessionActive } from "@/lib/admin-session";
import { verifyOrderAccessToken } from "@/lib/order-token";
import { releaseOrderStock } from "@/lib/order";

const orderWithItemsInclude = {
  items: { include: { variant: { include: { product: true } } } },
} as const;

const allowedStatuses = ["pending", "paid", "cancelled", "refunded"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!(await isAdminSessionActive()) && !verifyOrderAccessToken(id, token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: orderWithItemsInclude,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: string; trackingInfo?: string };

  const data: { status?: string; trackingInfo?: string | null } = {};

  if (body.status !== undefined) {
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Si se cancela un pedido que todavia estaba "pending", devolvemos el
    // stock que le habiamos reservado (no hace nada si ya no esta pending).
    if (body.status === "cancelled") {
      await releaseOrderStock(id);
    }

    data.status = body.status;
  }

  if (body.trackingInfo !== undefined) {
    data.trackingInfo = body.trackingInfo || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: orderWithItemsInclude,
  });

  return NextResponse.json(order);
}
