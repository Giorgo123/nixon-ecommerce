import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import OrderStatusActions from "@/components/admin/OrderStatusActions";
import TrackingInfoForm from "@/components/admin/TrackingInfoForm";
import { catalogCategoryLabels } from "@/lib/categories";

export const dynamic = "force-dynamic";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        variant: {
          include: {
            product: true;
          };
        };
      };
    };
  };
}>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order: OrderWithItems | null = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3">
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          ← Volver a pedidos
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          Orden {order.id}
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Estado: {order.status}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Datos del cliente
          </h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-black/60 dark:text-white/60">Nombre:</span> {order.fullName}</p>
            <p><span className="text-black/60 dark:text-white/60">Email:</span> {order.email}</p>
            <p><span className="text-black/60 dark:text-white/60">Teléfono:</span> {order.phone}</p>
            <p><span className="text-black/60 dark:text-white/60">Pago:</span> {order.paymentId ?? "Pendiente"}</p>
            <p><span className="text-black/60 dark:text-white/60">Entrega:</span> {order.deliveryMethod === "pickup" ? "Retiro en Villa María" : "Envío a domicilio"}</p>
            {order.deliveryMethod === "pickup" ? (
              <p className="sm:col-span-2"><span className="text-black/60 dark:text-white/60">Coordinar retiro con:</span> {order.phone} / {order.email}</p>
            ) : (
              <p className="sm:col-span-2"><span className="text-black/60 dark:text-white/60">Dirección:</span> {order.address}, {order.city}, {order.state} {order.zipCode}</p>
            )}
          </div>
          {order.deliveryMethod === "shipping" && (
            <div className="border-t border-black/10 pt-4 dark:border-white/10">
              <TrackingInfoForm orderId={order.id} initialValue={order.trackingInfo ?? ""} />
            </div>
          )}
        </section>

        <OrderStatusActions orderId={order.id} currentStatus={order.status} />
      </div>

      <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Productos
        </h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm dark:border-white/10">
              <div>
                <p className="font-medium text-black dark:text-white">
                  {item.variant.product.name}
                  {item.variant.size && (
                    <span className="text-black/60 dark:text-white/60"> — Talle {item.variant.size}</span>
                  )}
                </p>
                <p className="text-black/60 dark:text-white/60">
                  {catalogCategoryLabels[item.variant.product.category] ?? item.variant.product.category} · Cantidad: {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-black dark:text-white">
                ${(item.price * item.quantity).toLocaleString("es-AR")}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
          <span className="text-black/60 dark:text-white/60">Total</span>
          <span className="text-lg font-semibold text-black dark:text-white">
            ${order.totalPrice.toLocaleString("es-AR")}
          </span>
        </div>
      </section>
    </main>
  );
}
