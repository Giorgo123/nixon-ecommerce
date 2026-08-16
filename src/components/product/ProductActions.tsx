"use client";

import { useState } from "react";
import useCartStore from "@/store/cart.store";
import type { Product } from "@/features/products/types";
import { trackEvent } from "@/lib/analytics";
import SizeGuideModal from "@/components/product/SizeGuideModal";

interface ProductActionsProps {
  product: Product;
}

// La tienda funciona a pedido: el talle elegido siempre se puede pedir,
// tenga o no stock cargado en ese momento — el stock queda como referencia
// interna (para saber que hay que reponer/hacer), no como un bloqueo de
// compra. El cliente hace el pedido y la entrega/envio se coordina despues.
export default function ProductActions({ product }: ProductActionsProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const needsSizePicker = product.variants.length > 1;

  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(firstInStock?.id);
  const [added, setAdded] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const canAdd = Boolean(selectedVariant);
  const selectedIsOnRequest = (selectedVariant?.stock ?? 0) <= 0;

  function handleAdd() {
    if (!selectedVariant) return;

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.category,
        size: selectedVariant.size,
        color: selectedVariant.color,
        stock: selectedVariant.stock,
      },
      1
    );
    trackEvent("add_to_cart", {
      currency: "ARS",
      value: product.price,
      items: [{ item_id: selectedVariant.id, item_name: product.name, price: product.price, quantity: 1 }],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openDrawer();
  }

  return (
    <div className="space-y-4">
      {needsSizePicker && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
              Talle
            </p>
            <SizeGuideModal />
          </div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={[
                    "min-w-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    isSelected
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-black/10 text-black hover:border-red-500/50 dark:border-white/10 dark:text-white",
                  ].join(" ")}
                >
                  {variant.size ?? "Único"}
                </button>
              );
            })}
          </div>
          {selectedIsOnRequest && (
            <p className="text-xs text-black/50 dark:text-white/50">
              Este talle es a pedido — lo coordinamos por email o WhatsApp después de la compra, puede demorar un poco más.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className="inline-flex w-full items-center justify-center rounded-full border border-red-500/40 px-6 py-4 text-sm font-bold uppercase tracking-wide text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {added ? "¡Agregado!" : "Agregar al carrito"}
      </button>
    </div>
  );
}
