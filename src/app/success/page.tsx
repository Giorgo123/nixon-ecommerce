import Link from "next/link";
import type { Order } from "@/types/order";

export const dynamic = "force-dynamic";

async function getOrder(orderId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/orders/${orderId}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as Order;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrder(orderId) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-black/10 bg-black/5 p-8 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          Pago exitoso
        </p>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          Gracias por tu compra
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {order
            ? `Tu orden ${order.id} quedó registrada y está en estado ${order.status}.`
            : "Tu pago fue procesado. Estamos recuperando el detalle de la orden."}
        </p>

        {order && (
          <>
            <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-5 text-sm dark:border-white/10 dark:bg-black/20 sm:grid-cols-2">
              <div>
                <p className="text-black/60 dark:text-white/60">Cliente</p>
                <p className="font-medium text-black dark:text-white">{order.fullName}</p>
              </div>
              <div>
                <p className="text-black/60 dark:text-white/60">Estado</p>
                <p className="font-medium text-black dark:text-white">{order.status}</p>
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
              </div>
            </div>

            <div className="space-y-3 border-t border-black/10 pt-5 dark:border-white/10">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Productos
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
                  >
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-black/60 dark:text-white/60">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-black dark:text-white">
                      ${(Number(item.price ?? item.product.price) * item.quantity).toLocaleString("es-AR")}
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
