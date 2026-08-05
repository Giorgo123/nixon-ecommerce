"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "refunded", label: "Reembolsada" },
] as const;

const statusClasses: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  refunded: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  paid_stock_conflict: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  pending_transfer: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusActions({
  orderId,
  currentStatus,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo actualizar el estado");
      }

      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Error desconocido"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
      <h2 className="text-lg font-semibold text-black dark:text-white">
        Estado de la orden
      </h2>
      <div
        className={[
          "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
          statusClasses[currentStatus] ?? "border-black/10 text-black dark:border-white/10 dark:text-white",
        ].join(" ")}
      >
        {currentStatus}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {statuses.map((status) => (
          <button
            key={status.value}
            type="button"
            disabled={loading || currentStatus === status.value}
            onClick={() => updateStatus(status.value)}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              currentStatus === status.value
                ? statusClasses[status.value]
                : "border-black/10 text-black hover:border-red-500/40 dark:border-white/10 dark:text-white",
            ].join(" ")}
          >
            {status.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </section>
  );
}
