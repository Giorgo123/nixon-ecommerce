"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { SOCIAL_LINKS } from "@/lib/constants/social";
import type { Product } from "@/features/products/types";

interface LookbookProps {
  products: Product[];
}

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// Fotos reales de producto (las mismas que ya se usan en el catálogo), no
// contenido de Instagram inventado — funciona como vidriera y linkea a la
// cuenta real.
export default function Lookbook({ products }: LookbookProps) {
  const reduceMotion = useReducedMotion();
  const images = products.slice(0, 6);

  if (images.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center justify-between gap-4"
      >
        <h2 className="text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
          Seguinos en Instagram
        </h2>
        <a
          href={SOCIAL_LINKS.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:border-red-500/50 hover:text-red-500 dark:border-white/10 dark:text-white"
        >
          {SOCIAL_LINKS.instagram.handle}
        </a>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        {images.map((product) => (
          <motion.a
            key={product.id}
            variants={reduceMotion ? undefined : fadeUp}
            href={SOCIAL_LINKS.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-black/5 dark:bg-white/5"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 16vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </motion.a>
        ))}
      </motion.div>
    </section>
  );
}
