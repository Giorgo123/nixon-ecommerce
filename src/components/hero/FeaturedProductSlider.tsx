"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/features/products/types";

interface FeaturedProductSliderProps {
  products: Product[];
}

// Slider de "productos estrella" (isFeatured) debajo de los CTA del hero.
// Cada card cicla automaticamente entre la foto de portada y todas las fotos
// de galeria cargadas para ese producto.
export default function FeaturedProductSlider({ products }: FeaturedProductSliderProps) {
  if (products.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl justify-center gap-4 px-4 sm:px-6">
      {products.map((product) => (
        <FeaturedProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function FeaturedProductCard({ product }: { product: Product }) {
  const images = [product.image, ...product.images];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex w-32 shrink-0 flex-col overflow-hidden rounded-lg border border-white/15 bg-black/40 backdrop-blur-md transition-colors hover:border-red-500/60 sm:w-40"
    >
      <div className="relative h-32 w-full overflow-hidden sm:h-40">
        {images.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt={product.name}
            fill
            sizes="160px"
            className={`object-cover transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
          />
        ))}
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
