import Link from "next/link";
import prisma from "@/lib/prisma";
import { isDatabaseConnectionError } from "@/lib/db-safe";

export const dynamic = "force-dynamic";

const statusBadgeClasses: Record<string, string> = {
  pending: "text-amber-700 dark:text-amber-300",
  paid: "text-emerald-700 dark:text-emerald-300",
  cancelled: "text-rose-700 dark:text-rose-300",
  refunded: "text-sky-700 dark:text-sky-300",
  expired: "text-rose-700 dark:text-rose-300",
  paid_stock_conflict: "text-orange-700 dark:text-orange-300",
};

export default async function AdminDashboardPage() {
  let ordersCount = 0;
  let paidOrdersCount = 0;
  let productsCount = 0;
  let recentOrders: Array<{
    id: string;
    fullName: string;
    status: string;
    totalPrice: number;
    createdAt: Date;
  }> = [];
  let databaseUnavailable = false;

  try {
    [ordersCount, paidOrdersCount, productsCount, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "paid" } }),
      prisma.product.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          status: true,
          totalPrice: true,
          createdAt: true,
        },
      }),
    ]);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      databaseUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
        Dashboard
      </h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <p className="text-sm text-black/60 dark:text-white/60">Pedidos</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{ordersCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <p className="text-sm text-black/60 dark:text-white/60">Pagados</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{paidOrdersCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <p className="text-sm text-black/60 dark:text-white/60">Productos</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{productsCount}</p>
        </div>
      </div>

      {databaseUnavailable && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          La base de datos no responde en este entorno. El panel sigue visible,
          pero las métricas están temporariamente en cero.
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/orders" className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">
          Ver pedidos
        </Link>
        <Link href="/admin/products" className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black dark:border-white/10 dark:text-white">
          Ver productos
        </Link>
      </div>

      {!databaseUnavailable && (
        <section className="mt-8 rounded-3xl border border-black/10 p-6 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Actividad reciente
            </h2>
            <Link href="/admin/orders" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
              Ver todo
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
              >
                <div>
                  <p className="font-medium text-black dark:text-white">
                    {order.fullName}
                  </p>
                  <p className="text-black/60 dark:text-white/60">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
                    <span className={statusBadgeClasses[order.status] ?? ""}>
                      {order.status}
                    </span>
                  </p>
                  <p className="font-semibold text-black dark:text-white">
                    ${order.totalPrice.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
