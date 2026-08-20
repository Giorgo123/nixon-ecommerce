"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/features/products/types";

interface FeaturedProductSliderProps {
  products: Product[];
}

// Slider de "productos estrella" (isFeatured) debajo de los CTA del hero.
// Cada card desliza automaticamente de izquierda a derecha entre la foto de
// portada y todas las fotos de galeria cargadas para ese producto.
export default function FeaturedProductSlider({ products }: FeaturedProductSliderProps) {
  if (products.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-8 px-4 sm:gap-12 sm:px-6">
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
    }, 2600);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-xl border border-white/15 bg-black/40 backdrop-blur-md transition-colors hover:border-red-500/60 sm:w-64"
    >
      <div className="relative h-44 w-full overflow-hidden sm:h-64">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(-${activeIndex * (100 / images.length)}%)`,
          }}
        >
          {images.map((image) => (
            <div key={image} className="relative h-full shrink-0" style={{ width: `${100 / images.length}%` }}>
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="256px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-xs font-medium text-white sm:text-sm">{product.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-red-400 sm:text-sm">
          ${product.price.toLocaleString("es-AR")}
        </p>
      </div>
    </Link>
  );
}
