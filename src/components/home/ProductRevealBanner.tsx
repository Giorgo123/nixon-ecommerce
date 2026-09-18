"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Product } from "@/features/products/types";

interface ProductRevealBannerProps {
  products: Product[];
}

// Mismo patron de motion que HeroSection.tsx (staggerContainer + fadeUp),
// adaptado con `x` en vez de `y` para que cada foto entre deslizando desde
// un costado en vez de desde abajo. Se dispara con whileInView (no al
// montar, como en el Hero) porque esta seccion vive mas abajo en el home y
// recien es visible al hacer scroll.
const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.28,
      delayChildren: 0.1,
    },
  },
};

// Cada foto entra desde un costado alternado (izquierda/derecha/izquierda)
// para que la revelacion en secuencia se note como "deslizante", no como un
// simple fade.
const SLIDE_DIRECTIONS: Array<"left" | "right"> = ["left", "right", "left"];

function slideVariant(direction: "left" | "right"): Variants {
  return {
    hidden: { opacity: 0, x: direction === "left" ? -96 : 96 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

// Banner de 3 fotos reales de producto (portada de `Product.image`, cargadas
// en Vercel Blob) que se revelan de a una, deslizando desde un costado, hasta
// completar el set de 3 — no es un carrusel que rota. Con
// prefers-reduced-motion activo se renderizan las 3 fotos directamente, sin
// transicion.
export default function ProductRevealBanner({ products }: ProductRevealBannerProps) {
  const reduceMotion = useReducedMotion();
  const shown = products.slice(0, 3);

  if (shown.length === 0) return null;

  if (reduceMotion) {
    return (
      <section className="bg-nixon-bg-deep py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BannerHeading />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {shown.map((product) => (
              <PhotoCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-nixon-bg-deep py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <BannerHeading />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {shown.map((product, index) => (
            <motion.div
              key={product.id}
              variants={slideVariant(SLIDE_DIRECTIONS[index % SLIDE_DIRECTIONS.length])}
            >
              <PhotoCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function BannerHeading() {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-nixon-ink sm:text-4xl">
        Así se ven en la calle
      </h2>
      <p className="mt-2 text-nixon-muted">Fotos reales de piezas de nuestro catálogo</p>
    </div>
  );
}

function PhotoCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-nixon-border bg-nixon-surface"
    >
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-nixon-bg-deep/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-semibold text-nixon-ink drop-shadow-sm">{product.name}</p>
      </div>
    </Link>
  );
}
