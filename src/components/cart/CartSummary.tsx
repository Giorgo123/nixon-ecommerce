"use client";

import Link from "next/link";
import useCartStore from "@/store/cart.store";

interface CartSummaryProps {
  showActions?: boolean;
  compact?: boolean;
}

export default function CartSummary({
  showActions = false,
  compact = false,
}: CartSummaryProps) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);

  const subtotal = getTotal();
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <aside
      className={[
        "rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Carrito
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Vaciar
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Todavía no agregaste productos.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-black dark:text-white">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    ${item.product.price.toLocaleString("es-AR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-xs font-medium text-red-500"
                >
                  Quitar
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
                  Cantidad
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-base font-semibold text-black dark:border-white/10 dark:text-white"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-black dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-base font-semibold text-black dark:border-white/10 dark:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 space-y-3 border-t border-black/10 pt-4 dark:border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60 dark:text-white/60">Subtotal</span>
          <span className="font-medium text-black dark:text-white">
            ${subtotal.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60 dark:text-white/60">Envío</span>
          <span className="font-medium text-black dark:text-white">
            {shipping === 0 ? "Se calcula al final" : `$${shipping.toLocaleString("es-AR")}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-base">
          <span className="font-medium text-black dark:text-white">Total</span>
          <span className="text-lg font-semibold text-black dark:text-white">
            ${total.toLocaleString("es-AR")}
          </span>
        </div>
      </div>

      {showActions && items.length > 0 && (
        <div className="mt-6 space-y-3">
          <Link
            href="/products"
            className="inline-flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-black dark:border-white/10 dark:text-white"
          >
            Seguir comprando
          </Link>
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Finalizar compra
          </Link>
        </div>
      )}
    </aside>
  );
}
