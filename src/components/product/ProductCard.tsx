"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/features/products/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <article className="group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
        {/* Imagen */}
        <div className="relative h-64 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {product.stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white font-semibold">Agotado</span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-black dark:text-white line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-black dark:text-white">
              ${product.price.toLocaleString("es-AR")}
            </span>
            <span className="text-xs uppercase text-gray-500 dark:text-gray-400">
              {product.category === "oversize" ? "Oversize" : "Regular"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
