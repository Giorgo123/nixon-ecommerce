"use client";

import { useEffect, useState } from "react";

// Umbral fijo de scroll a partir del cual aparece el botón. 400px es
// suficiente para no mostrarlo apenas se carga la página, pero sin obligar
// a bajar una pantalla entera en viewports altos.
const SCROLL_THRESHOLD = 400;

// Botón flotante fijo "volver arriba". Se apila arriba de WhatsappButton
// (bottom-5, h-14) dejando un margen visible entre ambos, mismo z-50 (por
// encima del navbar z-40, por debajo del overlay/panel del CartDrawer
// z-[60] para no taparlo).
export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Volver arriba"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={[
        "fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-nixon-crimson text-white shadow-lg shadow-black/30 transition-opacity duration-300 hover:bg-nixon-crimson-bright",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <ArrowUpIcon />
    </button>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
