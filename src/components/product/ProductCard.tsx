"use client";

import Image from "next/image";
import Link from "next/link";
import useCartStore from "@/store/cart.store";
import type { Product } from "@/features/products/types";
import { catalogCategoryLabels } from "@/lib/categories";
import { trackEvent } from "@/lib/analytics";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const singleVariant = product.variants.length === 1 ? product.variants[0] : null;
  const isOnSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const discountPct = isOnSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  function handleQuickAdd() {
    if (!singleVariant) return;
    addItem(
      {
        variantId: singleVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.category,
        size: singleVariant.size,
        color: singleVariant.color,
        stock: singleVariant.stock,
      },
      1
    );
    trackEvent("add_to_cart", {
      currency: "ARS",
      value: product.price,
      items: [{ item_id: singleVariant.id, item_name: product.name, price: product.price, quantity: 1 }],
    });
    openDrawer();
  }

  return (
    <article className="group overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
      <Link href={`/products/${product.slug}`}>
        <div className="relative h-64 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1.5">
            {isOnSale && (
              <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                Nuevo
              </span>
            )}
            {totalStock <= 0 && (
              <span className="rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                A pedido
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          {catalogCategoryLabels[product.category] ?? product.category}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-black dark:text-white">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-gray-600 dark:text-gray-400">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-black dark:text-white">
              ${product.price.toLocaleString("es-AR")}
            </span>
            {isOnSale && (
              <span className="text-xs text-black/40 line-through dark:text-white/40">
                ${product.compareAtPrice!.toLocaleString("es-AR")}
              </span>
            )}
          </span>
          {singleVariant ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="shrink-0 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Agregar
            </button>
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="shrink-0 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Elegir talle
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
