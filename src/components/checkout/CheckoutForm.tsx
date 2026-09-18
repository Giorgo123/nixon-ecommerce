"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/cart.store";
import { trackEvent } from "@/lib/analytics";
import { parseJsonResponse } from "@/lib/utils";
import InstallmentsInfo from "@/components/payments/InstallmentsInfo";

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

      const payload = await parseJsonResponse<{
        error?: string;
        code?: string;
        discountAmount?: number;
      }>(response);

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

        const payload = await parseJsonResponse<{ error?: string; orderId?: string; token?: string }>(
          response
        );

        if (!response.ok || !payload.orderId || !payload.token) {
          throw new Error(payload.error ?? "No se pudo registrar el pedido");
        }

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

      const payload = await parseJsonResponse<{ error?: string; initPoint?: string }>(response);

      if (!response.ok || !payload.initPoint) {
        throw new Error(payload.error ?? "No se pudo iniciar el checkout");
      }

      clearCart();
      router.push(payload.initPoint);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-nixon-border bg-nixon-surface p-6 sm:p-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-nixon-muted">
          Entrega
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryMethod("shipping")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-surface",
              deliveryMethod === "shipping"
                ? "border-nixon-crimson bg-nixon-crimson/10 text-nixon-ink"
                : "border-nixon-border text-nixon-muted hover:border-nixon-ink-dim/30",
            ].join(" ")}
          >
            Envío a domicilio
            <span className="block text-xs font-normal text-nixon-muted">
              Gratis a todo el país
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMethod("pickup")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-surface",
              deliveryMethod === "pickup"
                ? "border-nixon-crimson bg-nixon-crimson/10 text-nixon-ink"
                : "border-nixon-border text-nixon-muted hover:border-nixon-ink-dim/30",
            ].join(" ")}
          >
            Retiro en Villa María
            <span className="block text-xs font-normal text-nixon-muted">
              Coordinamos por WhatsApp
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-nixon-muted">
          Datos de contacto
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nombre y apellido"
            required
            minLength={2}
            autoComplete="name"
            className="rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            className="rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Teléfono"
            type="tel"
            required
            minLength={6}
            inputMode="tel"
            autoComplete="tel"
            className="rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
          />
          {deliveryMethod === "shipping" && (
            <input
              value={zipCode}
              onChange={(event) => setZipCode(event.target.value)}
              placeholder="CP"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              className="rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
            />
          )}
        </div>
      </div>

      {deliveryMethod === "shipping" && (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-nixon-muted">
            Dirección de envío
          </p>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Dirección"
            required
            autoComplete="street-address"
            className="w-full rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ciudad"
              required
              autoComplete="address-level2"
              className="rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
            />
            <input
              value={stateValue}
              onChange={(event) => setStateValue(event.target.value)}
              placeholder="Provincia"
              required
              autoComplete="address-level1"
              className="rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
            />
          </div>
        </div>
      )}

      {deliveryMethod === "pickup" && (
        <p className="rounded-xl border border-nixon-border bg-nixon-surface-2 px-4 py-3 text-sm text-nixon-muted">
          Una vez confirmada la compra te contactamos por WhatsApp o email para coordinar el retiro en Villa María, Córdoba.
        </p>
      )}

      <div className="space-y-3 border-t border-nixon-border pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-nixon-muted">
          Medio de pago
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("mercadopago")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-surface",
              paymentMethod === "mercadopago"
                ? "border-nixon-crimson bg-nixon-crimson/10 text-nixon-ink"
                : "border-nixon-border text-nixon-muted hover:border-nixon-ink-dim/30",
            ].join(" ")}
          >
            Mercado Pago
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("transfer")}
            className={[
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-surface",
              paymentMethod === "transfer"
                ? "border-nixon-crimson bg-nixon-crimson/10 text-nixon-ink"
                : "border-nixon-border text-nixon-muted hover:border-nixon-ink-dim/30",
            ].join(" ")}
          >
            Transferencia bancaria
          </button>
        </div>
        {paymentMethod === "transfer" && (
          <p className="rounded-xl border border-nixon-border bg-nixon-surface-2 px-4 py-3 text-sm text-nixon-muted">
            Al confirmar, te vamos a mostrar los datos para transferir. Preparamos tu pedido apenas veamos el pago acreditado.
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-nixon-border pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-nixon-muted">
          Cupón de descuento
        </p>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
            <span className="text-emerald-400">
              Cupón <strong>{appliedCoupon.code}</strong> aplicado: -$
              {appliedCoupon.discountAmount.toLocaleString("es-AR")}
            </span>
            <button type="button" onClick={removeCoupon} className="text-xs font-medium text-nixon-crimson hover:text-nixon-crimson-bright hover:underline">
              Quitar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              placeholder="Código de cupón"
              className="flex-1 rounded-xl border border-nixon-border bg-nixon-bg-deep px-4 py-3 text-sm text-nixon-ink placeholder:text-nixon-muted transition-colors focus:border-nixon-crimson focus:outline-none focus:ring-1 focus:ring-nixon-crimson/30"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              className="shrink-0 rounded-xl border border-nixon-border px-4 py-3 text-sm font-medium text-nixon-ink transition-colors hover:border-nixon-ink-dim/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {couponLoading ? "Verificando..." : "Aplicar"}
            </button>
          </div>
        )}
        {couponError && <p className="text-xs text-nixon-crimson-bright">{couponError}</p>}
      </div>

      <div className="space-y-4 rounded-2xl border border-nixon-border bg-nixon-surface-2 p-5">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between text-nixon-muted">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString("es-AR")}</span>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-emerald-400">
              <span>Descuento</span>
              <span>-${appliedCoupon.discountAmount.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-nixon-border pt-2 text-lg font-semibold text-nixon-ink">
            <span>Total</span>
            <span>${Math.max(0, subtotal - (appliedCoupon?.discountAmount ?? 0)).toLocaleString("es-AR")}</span>
          </div>
        </div>

        {paymentMethod === "mercadopago" && (
          <InstallmentsInfo
            amount={Math.max(0, subtotal - (appliedCoupon?.discountAmount ?? 0))}
            variant="detailed"
          />
        )}

        {error && <p className="text-sm text-nixon-crimson-bright">{error}</p>}

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full rounded-full bg-nixon-crimson px-4 py-4 text-sm font-semibold text-nixon-ink transition-colors hover:bg-nixon-crimson-bright disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-surface-2"
        >
          {loading
            ? "Confirmando..."
            : paymentMethod === "transfer"
              ? "Confirmar pedido"
              : "Pagar con Mercado Pago"}
        </button>
      </div>
    </form>
  );
}
