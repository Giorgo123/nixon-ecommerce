"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PROMO_BAR_ROTATING, PROMO_BAR_TOP } from "@/lib/constants/commerce-copy";

const ROTATE_MS = 4000;
// Duracion de un ciclo completo del marquee (texto repetido -50% -> vuelve a
// 0). Fija en vez de depender del ancho real del texto: mas simple, y a esta
// longitud de copy el ritmo se percibe parejo en mobile y desktop.
const MARQUEE_DURATION_S = 18;

export default function PromoBar() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % PROMO_BAR_ROTATING.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-nixon-bg-deep text-nixon-ink-dim">
      <div className="overflow-hidden py-1.5">
        {reduceMotion ? (
          <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 text-center text-[11px] font-medium tracking-wide sm:text-xs">
            {PROMO_BAR_TOP}
          </div>
        ) : (
          <motion.div
            className="flex w-max items-center whitespace-nowrap text-[11px] font-medium tracking-wide sm:text-xs"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: MARQUEE_DURATION_S, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            {[0, 1].map((copyIndex) => (
              <span key={copyIndex} className="px-6">
                {PROMO_BAR_TOP}
              </span>
            ))}
          </motion.div>
        )}
        {!reduceMotion && <span className="sr-only">{PROMO_BAR_TOP}</span>}
      </div>
      <div className="border-t border-nixon-border/60">
        <div
          className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-1.5 text-center text-[11px] tracking-wide text-nixon-muted sm:text-xs"
          aria-live="polite"
        >
          {PROMO_BAR_ROTATING[index]}
        </div>
      </div>
    </div>
  );
}
