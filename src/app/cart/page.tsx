import CartSummary from "@/components/cart/CartSummary";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          Carrito
        </p>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl lg:text-5xl">
          Revisá tu selección
        </h1>
      </div>

      <div className="mx-auto max-w-3xl">
        <CartSummary showActions />
      </div>
    </main>
  );
}
