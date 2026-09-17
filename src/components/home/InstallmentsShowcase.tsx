"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import InstallmentsInfo from "@/components/payments/InstallmentsInfo";

interface InstallmentsShowcaseProps {
  referenceAmount: number;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function InstallmentsShowcase({ referenceAmount }: InstallmentsShowcaseProps) {
  const reduceMotion = useReducedMotion();

  if (referenceAmount <= 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <motion.div
        variants={reduceMotion ? undefined : fadeUp}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.3 }}
        className="rounded-3xl border border-black/10 bg-black/2 p-8 dark:border-white/10 dark:bg-white/2 sm:p-12"
      >
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
              Cuotas y financiación
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
              Pagá en cuotas reales, no en promesas
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-black/60 dark:text-white/60">
              Esta información se consulta en vivo contra Mercado Pago — no es
              una lista fija que se desactualiza. Referencia sobre una compra
              de ${Math.round(referenceAmount).toLocaleString("es-AR")}.
            </p>
          </div>

          <InstallmentsInfo
            amount={referenceAmount}
            variant="detailed"
            className="w-full max-w-sm lg:w-96"
          />
        </div>
      </motion.div>
    </section>
  );
}
