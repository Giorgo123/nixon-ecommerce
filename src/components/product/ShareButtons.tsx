"use client";

import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

// Comparte con el selector nativo del sistema (Nike hace lo mismo): el
// cliente elige de ahi que red o app usar, en vez de tener una fila fija de
// iconos hardcodeados. Si el navegador no soporta Web Share API (la mayoria
// de los navegadores de escritorio), copia el link al portapapeles.
export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // El usuario cerro el selector de compartir sin elegir nada - no es un error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá el link para compartir:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-black/60 transition-colors hover:text-red-500 dark:text-white/60"
    >
      <ShareIcon />
      {copied ? "¡Link copiado!" : "Compartir"}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" strokeLinecap="round" />
    </svg>
  );
}
