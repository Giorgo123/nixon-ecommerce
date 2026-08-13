"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CouponRowActionsProps {
  couponId: string;
  couponCode: string;
  active: boolean;
}

export default function CouponRowActions({ couponId, couponCode, active }: CouponRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el cupón");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el cupón "${couponCode}"?`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/coupons/${couponId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("No se pudo borrar el cupón");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={toggleActive}
        disabled={loading}
        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:border-white/30"
      >
        {active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Borrar
      </button>
    </div>
  );
}
