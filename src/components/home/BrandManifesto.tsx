"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function BrandManifesto() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-y border-black/10 bg-black py-20 dark:border-white/10 sm:py-28">
      <motion.div
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6"
      >
        <motion.p
          variants={reduceMotion ? undefined : fadeUp}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500"
        >
          Nixon Studio
        </motion.p>
        <motion.h2
          variants={reduceMotion ? undefined : fadeUp}
          className="mt-4 text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          No vendemos remeras.
          <br />
          Vendemos una estética.
        </motion.h2>
        <motion.p
          variants={reduceMotion ? undefined : fadeUp}
          className="mt-6 text-base leading-relaxed text-zinc-400"
        >
          Streetwear oversize y dark art pensados para durar: algodón peinado de
          alto gramaje, estampa serigráfica de alta densidad, y diseños que no
          vas a ver en cualquier lado. Operamos desde Villa María, Córdoba, con
          envío gratis a todo el país.
        </motion.p>
        <motion.p
          variants={reduceMotion ? undefined : fadeUp}
          className="mt-4 text-base leading-relaxed text-zinc-400"
        >
          Elegimos calidad de tela y de impresión antes que precio de oferta —
          por eso cada pieza pasa por selección y control antes de salir.
        </motion.p>
      </motion.div>
    </section>
  );
}
