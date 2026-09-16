import prisma from "@/lib/prisma";
import Link from "next/link";
import { isDatabaseConnectionError } from "@/lib/db-safe";
import Pagination from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type OrdersListItem = Awaited<ReturnType<typeof prisma.order.findMany>>[number];

const statusBadgeClasses: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  refunded: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  paid_stock_conflict: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  pending_transfer: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const PAYMENT_METHOD_FILTERS = [
  { value: undefined, label: "Todos" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "transfer", label: "Transferencia" },
] as const;

function isValidPaymentMethod(value: string | undefined): value is "mercadopago" | "transfer" {
  return value === "mercadopago" || value === "transfer";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; paymentMethod?: string }>;
}) {
  const { page: pageParam, paymentMethod: paymentMethodParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const paymentMethod = isValidPaymentMethod(paymentMethodParam) ? paymentMethodParam : undefined;
  const where = paymentMethod ? { paymentMethod } : undefined;

  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let totalOrders = 0;
  let databaseUnavailable = false;

  try {
    [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      databaseUnavailable = true;
    } else {
      throw error;
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          Pedidos
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {totalOrders} orden{totalOrders === 1 ? "" : "es"} en total.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PAYMENT_METHOD_FILTERS.map((filter) => {
          const isActive = filter.value === paymentMethod;
          const href = filter.value
            ? `/admin/orders?paymentMethod=${filter.value}`
            : "/admin/orders";
          return (
            <Link
              key={filter.label}
              href={href}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-black/10 text-black hover:border-black/30 dark:border-white/10 dark:text-white dark:hover:border-white/30",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          );
        })}
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
                <div className="flex items-center justify-end gap-1.5">
                  <p
                    className={[
                      "inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                      statusBadgeClasses[order.status] ?? "border-black/10 text-black dark:border-white/10 dark:text-white",
                    ].join(" ")}
                  >
                    {order.status}
                  </p>
                  <p className="inline-flex rounded-full border border-black/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/60 dark:border-white/10 dark:text-white/60">
                    {order.paymentMethod === "transfer" ? "Transferencia" : "Mercado Pago"}
                  </p>
                </div>
                <p className="mt-1 font-semibold text-black dark:text-white">
                  ${order.totalPrice.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination
        basePath="/admin/orders"
        currentPage={page}
        totalPages={totalPages}
        queryParams={{ paymentMethod }}
      />
    </main>
  );
}
