"use client";

import useCartStore from "@/store/cart.store";
import type { Product } from "@/features/products/types";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      type="button"
      onClick={() => addItem(product, 1)}
      disabled={product.stock <= 0}
      className="inline-flex items-center justify-center rounded-full border border-red-500/40 px-6 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Agregar al carrito
    </button>
  );
}
