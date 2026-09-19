"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// Copy genérico y verificable: los tres pasos reales del flujo de compra tal
// como existe hoy (catálogo -> Mercado Pago/transferencia -> envío gratis o
// retiro en Villa María). No duplica PromoBar/TrustBox (que listan hechos
// sueltos) ni ValueProps (mismo contenido en tiles) — esto explica el
// PROCESO de compra paso a paso, algo que ningún componente existente cubre.
const steps = [
  {
    number: "01",
    title: "Elegís tu producto",
    text: "Recorrés el catálogo y sumás remeras, buzos, posters o tazas al carrito. Sin crear cuenta.",
  },
  {
    number: "02",
    title: "Pagás como prefieras",
    text: "Mercado Pago (con cuotas reales sin interés según tarjeta) o transferencia bancaria, con descuento especial.",
  },
  {
    number: "03",
    title: "Recibís o retirás",
    text: "Envío gratis a todo el país, o retiro sin cargo en nuestro local de Villa María, Córdoba.",
  },
];

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
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
          Cómo comprar
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
          Del catálogo a tu casa
        </h2>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.3 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {steps.map((step) => (
          <motion.div
            key={step.number}
            variants={reduceMotion ? undefined : fadeUp}
            className="rounded-2xl border border-black/10 bg-black/2 p-6 dark:border-white/10 dark:bg-white/2"
          >
            <span className="text-3xl font-black text-red-500">{step.number}</span>
            <h3 className="mt-3 text-lg font-bold text-black dark:text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
              {step.text}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
