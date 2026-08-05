"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface TrackingInfoFormProps {
  orderId: string;
  initialValue: string;
}

export default function TrackingInfoForm({ orderId, initialValue }: TrackingInfoFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingInfo: value }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo guardar el tracking");
      }

      setSaved(true);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="text-sm font-medium text-black/80 dark:text-white/80" htmlFor="trackingInfo">
        Seguimiento del envío
      </label>
      <div className="flex gap-2">
        <input
          id="trackingInfo"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ej: Correo Argentino - CN123456789AR"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-full border border-black/10 px-4 py-2 text-xs font-medium text-black transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:border-white/30"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {saved && !error && <p className="text-xs text-emerald-600 dark:text-emerald-400">Guardado.</p>}
    </form>
  );
}
