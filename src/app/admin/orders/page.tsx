import prisma from "@/lib/prisma";
import Link from "next/link";
import { isDatabaseConnectionError } from "@/lib/db-safe";

export const dynamic = "force-dynamic";

type OrdersListItem = Awaited<ReturnType<typeof prisma.order.findMany>>[number];

const statusBadgeClasses: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  refunded: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  paid_stock_conflict: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
};

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let databaseUnavailable = false;

  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      databaseUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          Pedidos
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Últimas 20 órdenes registradas.
        </p>
      </div>

      <div className="space-y-4">
        {databaseUnavailable && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            La base de datos no responde en este entorno. No se pueden listar
            órdenes por ahora.
          </div>
        )}

        {orders.map((order: OrdersListItem) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="block rounded-2xl border border-black/10 p-4 transition-colors hover:border-red-500/40 dark:border-white/10"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-black dark:text-white">
                  {order.fullName}
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {order.email}
                </p>
              </div>
              <div className="text-right text-sm">
                <p
                  className={[
                    "inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                    statusBadgeClasses[order.status] ?? "border-black/10 text-black dark:border-white/10 dark:text-white",
                  ].join(" ")}
                >
                  {order.status}
                </p>
                <p className="font-semibold text-black dark:text-white">
                  ${order.totalPrice.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
