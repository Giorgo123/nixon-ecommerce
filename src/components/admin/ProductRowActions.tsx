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

  async function handleHide() {
    if (!confirm(`¿Ocultar "${productName}" de la tienda? Vas a poder volver a publicarlo cuando quieras.`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("No se pudo ocultar el producto");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (!response.ok) throw new Error("No se pudo publicar el producto");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
      >
        {loading ? "Publicando..." : "Publicar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleHide}
      disabled={loading}
      className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Ocultando..." : "Ocultar"}
    </button>
  );
}
