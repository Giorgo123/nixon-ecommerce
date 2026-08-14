"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import useCartStore from "@/store/cart.store";
import CartSummary from "@/components/cart/CartSummary";

// Mini-carrito lateral global, montado una sola vez en SiteShell. Se abre
// desde el navbar o al agregar un producto (ProductActions/ProductCard),
// sin navegar fuera de la pagina actual.
export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const pathname = usePathname();

  // Se cierra solo al navegar (ej: "Finalizar compra" o "Seguir comprando").
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeDrawer]);

  return (
    <div
      aria-hidden={!isOpen}
      className={[
        "fixed inset-0 z-[60] transition-opacity",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="Cerrar carrito"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={[
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-4 shadow-2xl transition-transform duration-300 dark:bg-black sm:p-6",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={closeDrawer}
          className="mb-2 flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full border border-black/10 text-lg text-black dark:border-white/10 dark:text-white"
          aria-label="Cerrar"
        >
          ×
        </button>
        <CartSummary showActions compact />
      </div>
    </div>
  );
}
