"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export default function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${productName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el producto");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
