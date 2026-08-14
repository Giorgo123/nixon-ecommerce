"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/cart.store";

// Evita que se pueda "entrar" a /checkout con el carrito vacio (link viejo,
// boton atras del navegador, refresh despues de vaciar el carrito). Espera a
// que el store de Zustand termine de hidratar desde localStorage antes de
// decidir, para no redirigir en falso a alguien que si tiene items.
export default function CheckoutGuard() {
  const router = useRouter();
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const itemsCount = useCartStore((state) => state.items.length);

  useEffect(() => {
    if (hasHydrated && itemsCount === 0) {
      router.replace("/cart");
    }
  }, [hasHydrated, itemsCount, router]);

  return null;
}
