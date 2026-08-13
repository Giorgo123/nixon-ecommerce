"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/cart.store";
import { trackEvent } from "@/lib/analytics";

type DeliveryMethod = "shipping" | "pickup";
type PaymentMethod = "mercadopago" | "transfer";

export default function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getTotal());
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercadopago");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });

      const payload = (await response.json()) as {
        error?: string;
        code?: string;
        discountAmount?: number;
      };

      if (!response.ok || !payload.code || payload.discountAmount === undefined) {
        throw new Error(payload.error ?? "Cupón inválido");
      }

      setAppliedCoupon({ code: payload.code, discountAmount: payload.discountAmount });
    } catch (couponValidationError) {
      setAppliedCoupon(null);
      setCouponError(
        couponValidationError instanceof Error ? couponValidationError.message : "Error desconocido"
      );
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

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
    const couponCode = appliedCoupon?.code;

    trackEvent("begin_checkout", {
      currency: "ARS",
      value: Math.max(0, subtotal - (appliedCoupon?.discountAmount ?? 0)),
      coupon: couponCode,
      items: items.map((item) => ({
        item_id: item.variantId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    try {
      if (paymentMethod === "transfer") {
        const response = await fetch("/api/checkout/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer, items, couponCode }),
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
        body: JSON.stringify({ customer, items, couponCode }),
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

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          Cupón de descuento
        </p>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
            <span className="text-emerald-700 dark:text-emerald-300">
              Cupón <strong>{appliedCoupon.code}</strong> aplicado: -$
              {appliedCoupon.discountAmount.toLocaleString("es-AR")}
            </span>
            <button type="button" onClick={removeCoupon} className="text-xs font-medium text-red-500 hover:underline">
              Quitar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              placeholder="Código de cupón"
              className="flex-1 rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm dark:border-white/10"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              className="shrink-0 rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-black transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:border-white/30"
            >
              {couponLoading ? "Verificando..." : "Aplicar"}
            </button>
          </div>
        )}
        {couponError && <p className="text-xs text-red-500">{couponError}</p>}
      </div>

      <div className="space-y-1 border-t border-black/10 pt-4 text-sm dark:border-white/10">
        <div className="flex items-center justify-between text-black/60 dark:text-white/60">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString("es-AR")}</span>
        </div>
        {appliedCoupon && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span>Descuento</span>
            <span>-${appliedCoupon.discountAmount.toLocaleString("es-AR")}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-base font-semibold text-black dark:text-white">
          <span>Total</span>
          <span>${Math.max(0, subtotal - (appliedCoupon?.discountAmount ?? 0)).toLocaleString("es-AR")}</span>
        </div>
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
