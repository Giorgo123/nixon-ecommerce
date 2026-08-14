"use client";

import { useEffect, useState } from "react";
import { SIZE_GUIDE_CM } from "@/lib/constants/commerce-copy";

export default function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-black/60 underline underline-offset-2 hover:text-red-500 dark:text-white/60"
      >
        Guía de talles
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar guía de talles"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Guía de talles"
            className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-black dark:text-white">Guía de talles</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black dark:border-white/10 dark:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-xs text-black/60 dark:text-white/60">
              Medidas en centímetros. Calce oversize: si estás entre dos talles, te recomendamos
              elegir el más chico para un calce más ajustado, o el más grande para más holgura.
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
                  <th className="py-2 font-medium">Talle</th>
                  <th className="py-2 font-medium">Pecho</th>
                  <th className="py-2 font-medium">Largo total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {SIZE_GUIDE_CM.map((row) => (
                  <tr key={row.size} className="text-black dark:text-white">
                    <td className="py-2.5 font-semibold">{row.size}</td>
                    <td className="py-2.5">{row.chest} cm</td>
                    <td className="py-2.5">{row.length} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
