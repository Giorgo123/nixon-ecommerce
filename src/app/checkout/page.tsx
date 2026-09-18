import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutGuard from "@/components/checkout/CheckoutGuard";
import CartSummary from "@/components/cart/CartSummary";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <CheckoutGuard />
      <div className="mb-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-nixon-crimson">
          Checkout
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight text-nixon-ink sm:text-4xl lg:text-5xl">
            Finalizá la compra
          </h1>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-nixon-border px-4 py-2 text-sm font-semibold text-nixon-ink transition-colors hover:border-nixon-ink-dim/30"
          >
            <span aria-hidden="true">←</span>
            Volver al carrito
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <CheckoutForm />
        <CartSummary />
      </div>
    </main>
  );
}
