"use client";

import Image from "next/image";
import Link from "next/link";
import useCartStore from "@/store/cart.store";
import type { Product } from "@/features/products/types";
import { catalogCategoryLabels } from "@/lib/categories";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const singleVariant = product.variants.length === 1 ? product.variants[0] : null;

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
  }

  return (
    <article className="group overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
      <Link href={`/products/${product.slug}`}>
        <div className="relative h-64 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {totalStock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="font-semibold text-white">Agotado</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-black dark:text-white">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-black dark:text-white">
            ${product.price.toLocaleString("es-AR")}
          </span>
          <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-black/60 dark:border-white/10 dark:text-white/60">
            {catalogCategoryLabels[product.category] ?? product.category}
          </span>
          {singleVariant ? (
            <button
              type="button"
              disabled={totalStock <= 0}
              onClick={handleQuickAdd}
              className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/30 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:disabled:bg-white/30"
            >
              Agregar
            </button>
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Elegir talle
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
