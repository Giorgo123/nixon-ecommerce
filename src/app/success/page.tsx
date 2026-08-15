import Link from "next/link";
import type { Order } from "@/types/order";
import { BANK_TRANSFER_INFO } from "@/lib/constants";
import PurchaseTracker from "@/components/analytics/PurchaseTracker";
import { parseJsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  pending: "pendiente de pago",
  pending_transfer: "esperando la transferencia",
  paid: "pagada",
  paid_stock_conflict: "pagada",
  cancelled: "cancelada",
  refunded: "reembolsada",
  expired: "cancelada",
};

async function getOrder(orderId: string, token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/orders/${orderId}?token=${token}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return null;
  }

  return await parseJsonResponse<Order>(response);
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; token?: string }>;
}) {
  const { orderId, token } = await searchParams;
  const order = orderId && token ? await getOrder(orderId, token) : null;
  const awaitingTransfer = order?.paymentMethod === "transfer" && order.status === "pending_transfer";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-black/10 bg-black/5 p-8 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          {awaitingTransfer ? "Pedido registrado" : "Pago exitoso"}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          {awaitingTransfer ? "¡Gracias! Ya casi está" : "Gracias por tu compra"}
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {order
            ? `Tu orden ${order.id} quedó registrada y está ${statusLabels[order.status] ?? order.status}.`
            : "Tu pago fue procesado. Estamos recuperando el detalle de la orden."}
        </p>

        {order && (
          <>
            <PurchaseTracker order={order} />
            {awaitingTransfer && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm">
                <h2 className="text-lg font-bold text-black dark:text-white">
                  Datos para transferir
                </h2>
                <p className="mt-2 text-black/70 dark:text-white/70">
                  Transferí <strong>${Number(order.totalPrice).toLocaleString("es-AR")}</strong> a:
                </p>
                <div className="mt-3 space-y-1 text-black/80 dark:text-white/80">
                  <p>Alias: <strong>{BANK_TRANSFER_INFO.alias}</strong></p>
                  <p>CVU: <strong>{BANK_TRANSFER_INFO.cvu}</strong></p>
                  <p>Titular: <strong>{BANK_TRANSFER_INFO.titular}</strong></p>
                </div>
                <p className="mt-3 text-xs text-black/60 dark:text-white/60">
                  Una vez que hagas la transferencia, avisanos por WhatsApp o email con el
                  comprobante — así lo confirmamos más rápido. Preparamos tu pedido apenas
                  vemos el pago acreditado.
                </p>
              </div>
            )}

            <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-5 text-sm dark:border-white/10 dark:bg-black/20 sm:grid-cols-2">
              <div>
                <p className="text-black/60 dark:text-white/60">Cliente</p>
                <p className="font-medium text-black dark:text-white">{order.fullName}</p>
              </div>
              <div>
                <p className="text-black/60 dark:text-white/60">Estado</p>
                <p className="font-medium text-black dark:text-white">
                  {statusLabels[order.status] ?? order.status}
                </p>
              </div>
              <div>
                <p className="text-black/60 dark:text-white/60">Email</p>
                <p className="font-medium text-black dark:text-white">{order.email}</p>
              </div>
              <div>
                <p className="text-black/60 dark:text-white/60">Total</p>
                <p className="font-medium text-black dark:text-white">
                  ${Number(order.totalPrice).toLocaleString("es-AR")}
                </p>
                {order.discountAmount > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Cupón {order.couponCode}: -${order.discountAmount.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-black/60 dark:text-white/60">Entrega</p>
                <p className="font-medium text-black dark:text-white">
                  {order.deliveryMethod === "pickup"
                    ? "Retiro en Villa María — te contactamos para coordinar"
                    : `Envío gratis a ${order.address}, ${order.city}, ${order.state}`}
                </p>
                {order.trackingInfo && (
                  <p className="mt-1 text-black/60 dark:text-white/60">
                    Seguimiento: {order.trackingInfo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t border-black/10 pt-5 dark:border-white/10">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Productos
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.variant.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
                  >
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {item.variant.product.name}
                        {item.variant.size && (
                          <span className="text-black/60 dark:text-white/60"> — Talle {item.variant.size}</span>
                        )}
                      </p>
                      <p className="text-black/60 dark:text-white/60">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-black dark:text-white">
                      ${(Number(item.price) * item.quantity).toLocaleString("es-AR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Link
            href="/products"
            className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
