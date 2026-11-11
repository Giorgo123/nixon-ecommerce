import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminSessionActive } from "@/lib/admin-session";
import { verifyOrderAccessToken } from "@/lib/order-token";
import { releaseOrderReservation, reReserveOrder } from "@/lib/order";
import { isPaidStatus, isReleasableStatus } from "@/lib/order-status";
import { sendStockConflictAlertEmail } from "@/lib/email";

const orderWithItemsInclude = {
  items: { include: { variant: { include: { product: true } } } },
} as const;

const allowedStatuses = ["pending", "paid", "cancelled", "refunded"] as const;
type AdminOrderStatus = (typeof allowedStatuses)[number];

function isAdminOrderStatus(value: string): value is AdminOrderStatus {
  return (allowedStatuses as readonly string[]).includes(value);
}

type CurrentOrder = { status: string; paymentId: string | null };

function conflict(error: string) {
  return NextResponse.json({ error }, { status: 409 });
}

// Transiciones explícitamente inválidas. Las que no aparecen acá se resuelven
// como no-op idempotente o con el helper de reserva (ver `applyStatusChange`).
//
// El objetivo es que una orden pagada nunca vuelva a `pending` (el barrido
// liberaría stock de una venta cobrada) ni a `cancelled` (se usa Reembolsada),
// y que una reembolsada quede terminal.
function invalidTransitionMessage(current: string, target: AdminOrderStatus) {
  if (target === "pending") {
    if (isPaidStatus(current)) return "Una orden pagada no puede volver a pendiente";
    if (current === "refunded") return "Una orden reembolsada no puede volver a pendiente";
    if (current === "expired" || current === "cancelled") {
      return "Una orden vencida o cancelada no puede volver a pendiente";
    }
  }

  if (target === "cancelled") {
    if (isPaidStatus(current)) return "Una orden pagada no se puede cancelar; usá Reembolsada";
    if (current === "refunded") return "Una orden reembolsada no se puede cancelar";
  }

  return null;
}

// Confirma el pago. Si la orden todavía tiene la reserva, se reclama con un
// updateMany condicionado (idempotente ante dos admins o un webhook
// concurrente). Si la reserva ya se había liberado, se revive con
// `reReserveOrder`: la venta existe y hay que volver a descontar stock/cupón.
async function confirmPaidOrder(id: string, current: CurrentOrder) {
  if (current.status === "refunded") {
    return conflict("Una orden reembolsada no se puede volver a pagar");
  }
  if (isPaidStatus(current.status)) return null;

  if (isReleasableStatus(current.status)) {
    const claimed = await prisma.order.updateMany({
      where: { id, status: { in: ["pending", "pending_transfer"] } },
      data: { status: "paid" },
    });
    if (claimed.count === 1) return null;

    // Otro proceso la movió entre la lectura y el claim.
    const latest = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentId: true },
    });
    if (!latest) return conflict("La orden cambió de estado");
    if (latest.status === "refunded") {
      return conflict("Una orden reembolsada no se puede volver a pagar");
    }
    if (latest.status === "expired" || latest.status === "cancelled") {
      return revivePaidOrder(id, latest.paymentId ?? undefined);
    }
    // paid/paid_stock_conflict/pending: otro camino ya la resolvió.
    return null;
  }

  if (current.status === "expired" || current.status === "cancelled") {
    return revivePaidOrder(id, current.paymentId ?? undefined);
  }

  return conflict("La orden no se puede marcar como pagada");
}

async function revivePaidOrder(id: string, paymentId: string | undefined) {
  const revived = await reReserveOrder(id, paymentId);
  if (!revived) return conflict("La orden cambió de estado");
  if (revived.stockConflict) {
    await sendStockConflictAlertEmail(revived.order);
  }
  return null;
}

async function applyStatusChange(id: string, current: CurrentOrder, target: AdminOrderStatus) {
  const invalid = invalidTransitionMessage(current.status, target);
  if (invalid) return conflict(invalid);

  if (target === "pending") {
    // pending → pending es idempotente. pending_transfer → pending también es
    // no-op: cambiaría el TTL de 72 h a 30 min y el barrido podría vencer una
    // transferencia que todavía puede acreditarse.
    return null;
  }

  if (target === "cancelled") {
    // cancelled/expired ya están sin reserva: no-op, no se libera dos veces.
    if (current.status === "cancelled" || current.status === "expired") return null;

    const { released } = await releaseOrderReservation(id, "cancelled");
    if (!released) return conflict("La orden cambió de estado");
    return null;
  }

  // target === "refunded"
  if (current.status === "refunded") return null;

  if (isReleasableStatus(current.status)) {
    const { released } = await releaseOrderReservation(id, "refunded");
    if (!released) return conflict("La orden cambió de estado");
    return null;
  }

  // paid/paid_stock_conflict: el reembolso no devuelve stock ni cupón porque la
  // reserva ya se consumió. expired/cancelled: ya estaba liberada.
  await prisma.order.update({ where: { id }, data: { status: "refunded" } });
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  // Falla cerrado: si algo se rompe validando la sesión/token (ej. falta
  // SESSION_SECRET), nunca se debe devolver el pedido — se responde 401 en
  // vez de dejar que el error suba sin manejar.
  let isAuthorized: boolean;
  try {
    isAuthorized = (await isAdminSessionActive()) || verifyOrderAccessToken(id, token);
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
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

  if (body.status !== undefined && !isAdminOrderStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (body.status === undefined && body.trackingInfo === undefined) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const current = await prisma.order.findUnique({
    where: { id },
    select: { status: true, paymentId: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (body.status === "paid") {
    const failure = await confirmPaidOrder(id, current);
    if (failure) return failure;
  } else if (body.status !== undefined) {
    const failure = await applyStatusChange(id, current, body.status);
    if (failure) return failure;
  }

  if (body.trackingInfo !== undefined) {
    await prisma.order.update({
      where: { id },
      data: { trackingInfo: body.trackingInfo || null },
    });
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
