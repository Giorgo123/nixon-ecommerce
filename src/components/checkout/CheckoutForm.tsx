"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/cart.store";

export default function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            fullName,
            email,
            phone,
            address,
            city,
            state: stateValue,
            zipCode,
          },
          items,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo iniciar el checkout");
      }

      const payload = (await response.json()) as { initPoint: string };
      clearCart();
      router.push(payload.initPoint);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nombre y apellido" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Teléfono" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        <input value={zipCode} onChange={(event) => setZipCode(event.target.value)} placeholder="CP" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
      </div>
      <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Dirección" className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ciudad" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        <input value={stateValue} onChange={(event) => setStateValue(event.target.value)} placeholder="Provincia" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
      </button>
    </form>
  );
}
