"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseJsonResponse } from "@/lib/utils";

const inputClasses =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40";
const labelClasses = "text-sm font-medium text-black/80 dark:text-white/80";

export default function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value,
          maxUses: maxUses || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await parseJsonResponse(response);
        throw new Error(payload.error ?? "No se pudo crear el cupón");
      }

      setCode("");
      setValue("");
      setMaxUses("");
      setExpiresAt("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2">
        <label className={labelClasses} htmlFor="coupon-code">Código</label>
        <input
          id="coupon-code"
          className={inputClasses}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="VERANO10"
          required
        />
      </div>

      <div className="space-y-2">
        <label className={labelClasses} htmlFor="coupon-type">Tipo</label>
        <select
          id="coupon-type"
          className={inputClasses}
          value={type}
          onChange={(event) => setType(event.target.value as "percentage" | "fixed")}
        >
          <option value="percentage">% Porcentaje</option>
          <option value="fixed">$ Monto fijo</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className={labelClasses} htmlFor="coupon-value">
          Valor {type === "percentage" ? "(%)" : "($)"}
        </label>
        <input
          id="coupon-value"
          type="number"
          min="0"
          max={type === "percentage" ? 100 : undefined}
          step="0.01"
          className={inputClasses}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className={labelClasses} htmlFor="coupon-max-uses">Usos máximos</label>
        <input
          id="coupon-max-uses"
          type="number"
          min="1"
          className={inputClasses}
          value={maxUses}
          onChange={(event) => setMaxUses(event.target.value)}
          placeholder="Ilimitado"
        />
      </div>

      <div className="space-y-2">
        <label className={labelClasses} htmlFor="coupon-expires">Vencimiento</label>
        <input
          id="coupon-expires"
          type="date"
          className={inputClasses}
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-5">
        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {loading ? "Creando..." : "Crear cupón"}
        </button>
      </div>
    </form>
  );
}
