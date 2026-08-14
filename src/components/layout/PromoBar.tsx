"use client";

import { useEffect, useState } from "react";
import { PROMO_BAR_ROTATING, PROMO_BAR_TOP } from "@/lib/constants/commerce-copy";

const ROTATE_MS = 4000;

export default function PromoBar() {
  const [index, setIndex] = useState(0);

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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-1.5 text-center text-[11px] font-medium tracking-wide sm:text-xs">
        {PROMO_BAR_TOP}
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
