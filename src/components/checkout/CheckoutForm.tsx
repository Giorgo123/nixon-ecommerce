"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/cart.store";

type DeliveryMethod = "shipping" | "pickup";
type PaymentMethod = "mercadopago" | "transfer";

export default function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercadopago");
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

    const customer = {
      fullName,
      email,
      phone,
      deliveryMethod,
      ...(deliveryMethod === "shipping" ? { address, city, state: stateValue, zipCode } : {}),
    };

    try {
      if (paymentMethod === "transfer") {
        const response = await fetch("/api/checkout/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer, items }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "No se pudo registrar el pedido");
        }

        const payload = (await response.json()) as { orderId: string; token: string };
        clearCart();
        router.push(`/success?orderId=${payload.orderId}&token=${payload.token}`);
        return;
      }

      const response = await fetch("/api/checkout/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer, items }),
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
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Entrega
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryMethod("shipping")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
              deliveryMethod === "shipping"
                ? "border-red-500 bg-red-500/10 text-black dark:text-white"
                : "border-black/10 text-black/70 dark:border-white/10 dark:text-white/70",
            ].join(" ")}
          >
            Envío a domicilio
            <span className="block text-xs font-normal text-black/50 dark:text-white/50">
              Gratis a todo el país
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMethod("pickup")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
              deliveryMethod === "pickup"
                ? "border-red-500 bg-red-500/10 text-black dark:text-white"
                : "border-black/10 text-black/70 dark:border-white/10 dark:text-white/70",
            ].join(" ")}
          >
            Retiro en Villa María
            <span className="block text-xs font-normal text-black/50 dark:text-white/50">
              Coordinamos por WhatsApp
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nombre y apellido" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Teléfono" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        {deliveryMethod === "shipping" && (
          <input value={zipCode} onChange={(event) => setZipCode(event.target.value)} placeholder="CP" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
        )}
      </div>

      {deliveryMethod === "shipping" && (
        <>
          <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Dirección" className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ciudad" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
            <input value={stateValue} onChange={(event) => setStateValue(event.target.value)} placeholder="Provincia" className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10" />
          </div>
        </>
      )}

      {deliveryMethod === "pickup" && (
        <p className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          Una vez confirmada la compra te contactamos por WhatsApp o email para coordinar el retiro en Villa María, Córdoba.
        </p>
      )}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Medio de pago
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("mercadopago")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
              paymentMethod === "mercadopago"
                ? "border-red-500 bg-red-500/10 text-black dark:text-white"
                : "border-black/10 text-black/70 dark:border-white/10 dark:text-white/70",
            ].join(" ")}
          >
            Mercado Pago
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("transfer")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
              paymentMethod === "transfer"
                ? "border-red-500 bg-red-500/10 text-black dark:text-white"
                : "border-black/10 text-black/70 dark:border-white/10 dark:text-white/70",
            ].join(" ")}
          >
            Transferencia bancaria
          </button>
        </div>
        {paymentMethod === "transfer" && (
          <p className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Al confirmar, te vamos a mostrar los datos para transferir. Preparamos tu pedido apenas veamos el pago acreditado.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Confirmando..."
          : paymentMethod === "transfer"
            ? "Confirmar pedido"
            : "Pagar con Mercado Pago"}
      </button>
    </form>
  );
}
