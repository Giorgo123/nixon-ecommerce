"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Product } from "@/features/products/types";

interface EditorialTriptychProps {
  products: Product[];
}

const TILE_COUNT = 3;

// Bento de 3 fotos que cierra el home, justo despues del mosaico de
// Instagram. Mobile: una foto ancha arriba + dos cuadradas al lado.
// Desktop: 3 columnas verticales del mismo alto (3/4), que es lo que permite
// que la fila de la grilla tenga un alto real.
//
// OJO: no usar `sm:grid-rows-2` + `row-span-2` para el bento. Las filas `1fr`
// colapsan a 0 cuando la grilla no tiene alto definido (y las fotos con
// `next/image fill` no aportan alto intrinseco), dejando los tiles con 2px de
// alto. Por eso el alto sale de un aspect-ratio explicito en cada breakpoint.
const TILE_CLASSES = [
  "col-span-2 aspect-[4/3] sm:col-span-1 sm:aspect-[3/4]",
  "aspect-square sm:aspect-[3/4]",
  "aspect-square sm:aspect-[3/4]",
];

const TILE_SIZES = [
  "(min-width: 640px) 33vw, 100vw",
  "(min-width: 640px) 33vw, 50vw",
  "(min-width: 640px) 33vw, 50vw",
];

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// Ultima seccion de imagenes del home. Usa SIEMPRE la primer foto de galeria
// (`images[index]`) y no la portada: la portada ya se muestra en el grid de
// destacados, en el banner y en el mosaico de Lookbook, asi que un cierre con
// `image` repetiria fotos que el usuario acaba de ver. `page.tsx` ya garantiza
// que estos productos no esten repetidos arriba.
function tileCaption(product: Product, index: number) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {index === 0 ? "Nueva" : "Del catálogo"}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-white drop-shadow-sm sm:text-base">
            {product.name}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-bold text-white/90 transition-colors group-hover:border-nixon-crimson-bright group-hover:text-nixon-crimson-bright">
          ${product.price.toLocaleString("es-AR")}
        </span>
      </div>
    </>
  );
}

export default function EditorialTriptych({ products }: EditorialTriptychProps) {
  const reduceMotion = useReducedMotion();
  const shown = products.slice(0, TILE_COUNT);

  if (shown.length === 0) return null;

  return (
    <section className="bg-white py-14 dark:bg-black sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-4"
        >
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
              La última tirada
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Tres piezas del catálogo, fotografiadas de cerca.
            </p>
          </div>
          <Link
            href="/products"
            className="shrink-0 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:border-red-500/50 hover:text-red-500 dark:border-white/10 dark:text-white"
          >
            Ver el catálogo
          </Link>
        </motion.div>

        <motion.div
          variants={reduceMotion ? undefined : staggerContainer}
          initial={reduceMotion ? undefined : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {shown.map((product, index) => (
            // El Link ES la celda de la grilla (y el elemento de motion): si
            // las clases de aspecto vivieran en un wrapper, el link interno no
            // hereda ese alto y la foto se renderiza con altura 0.
            <motion.a
              key={product.id}
              href={`/products/${product.slug}`}
              aria-label={product.name}
              variants={reduceMotion ? undefined : fadeUp}
              className={`group relative block min-w-0 overflow-hidden rounded-2xl border border-nixon-border bg-nixon-surface ${TILE_CLASSES[index]}`}
            >
              <Image
                src={product.images[index] ?? product.image}
                alt={product.name}
                fill
                sizes={TILE_SIZES[index]}
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-nixon-bg-deep/85 via-nixon-bg-deep/10 to-transparent" />
              {tileCaption(product, index)}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
