"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/features/products/types";

interface FeaturedProductSliderProps {
  products: Product[];
}

// Slider flotante de "productos estrella" (isFeatured) superpuesto al video
// del hero. Al pasar el mouse, cada card alterna entre la foto principal y
// la primera foto de la galeria del producto.
export default function FeaturedProductSlider({ products }: FeaturedProductSliderProps) {
  if (products.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-28 z-20 hidden px-4 sm:block sm:bottom-32 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl justify-center gap-4">
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function FeaturedProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const secondaryImage = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex w-32 shrink-0 flex-col overflow-hidden rounded-lg border border-white/15 bg-black/40 backdrop-blur-md transition-colors hover:border-red-500/60 sm:w-40"
    >
      <div className="relative h-32 w-full overflow-hidden sm:h-40">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="160px"
          className={`object-cover transition-opacity duration-500 ${hovered && secondaryImage ? "opacity-0" : "opacity-100"}`}
        />
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={product.name}
            fill
            sizes="160px"
            className={`object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="truncate text-[11px] font-medium text-white">{product.name}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-red-400">
          ${product.price.toLocaleString("es-AR")}
        </p>
      </div>
    </Link>
  );
}
