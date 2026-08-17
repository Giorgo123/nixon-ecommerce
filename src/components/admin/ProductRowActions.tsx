"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductRowActionsProps {
  productId: string;
  productName: string;
  active: boolean;
}

export default function ProductRowActions({ productId, productName, active }: ProductRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setActive(nextActive: boolean) {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!response.ok) throw new Error(nextActive ? "No se pudo publicar el producto" : "No se pudo ocultar el producto");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // Borra el producto de la base para siempre, incluido su historial de
  // pedidos asociado. Para conservar el historial, usar "Ocultar" en su lugar.
  async function handleDelete() {
    if (
      !confirm(
        `¿Eliminar "${productName}" definitivamente? Esto borra el producto y, si tuvo pedidos, también esas líneas de pedido. No se puede deshacer. Si preferís conservar el historial, usá "Ocultar".`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo eliminar el producto");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      {active ? (
        <button
          type="button"
          onClick={() => setActive(false)}
          disabled={loading}
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:border-white/30"
        >
          Ocultar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          disabled={loading}
          className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
        >
          Publicar
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "..." : "Eliminar"}
      </button>
    </div>
  );
}
