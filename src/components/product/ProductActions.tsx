"use client";

import { useState } from "react";
import useCartStore from "@/store/cart.store";
import type { Product } from "@/features/products/types";
import { trackEvent } from "@/lib/analytics";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import { sortBySize } from "@/lib/constants/commerce-copy";

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
            <p className="text-xs uppercase tracking-[0.2em] text-nixon-muted">
              Talle
            </p>
            <SizeGuideModal />
          </div>
          <div className="flex flex-wrap gap-2">
            {sortBySize(product.variants).map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const isOnRequest = variant.stock <= 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  aria-pressed={isSelected}
                  className={[
                    "min-w-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-bg",
                    isSelected
                      ? "border-nixon-crimson bg-nixon-crimson text-white"
                      : isOnRequest
                        ? "border-nixon-border text-nixon-muted hover:border-nixon-crimson-bright hover:text-nixon-ink"
                        : "border-nixon-border text-nixon-ink hover:border-nixon-crimson-bright",
                  ].join(" ")}
                >
                  {variant.size ?? "Único"}
                </button>
              );
            })}
          </div>
          {selectedIsOnRequest && (
            <p className="text-xs text-nixon-muted">
              Este talle es a pedido — lo coordinamos por email o WhatsApp después de la compra, puede demorar un poco más.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className={[
          "inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-bold uppercase tracking-wide text-white transition-all duration-150 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-bg",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          added ? "bg-emerald-600" : "bg-nixon-crimson hover:bg-nixon-crimson-bright",
        ].join(" ")}
      >
        {added ? "¡Agregado!" : "Agregar al carrito"}
      </button>
    </div>
  );
}
