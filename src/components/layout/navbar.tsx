"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import useCartStore from "@/store/cart.store";

const subscribeNoop = () => () => {};

export default function Navbar() {
  const itemsCount = useCartStore((state) => state.getItemsCount());
  // The cart is persisted to localStorage, so its real value is only known
  // after hydration; render the server/first-paint snapshot (false) until then.
  const hasMounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/50">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.22em] uppercase"
        >
          Nixon Studio
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/products" className="hover:opacity-70">
            Catálogo
          </Link>
          <Link href="/contacto" className="hover:opacity-70">
            Contacto
          </Link>
          <Link href="/cart" className="hover:opacity-70">
            Carrito
            {hasMounted && itemsCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {itemsCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
