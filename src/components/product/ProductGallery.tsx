"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type MediaItem = { type: "image"; src: string } | { type: "video"; src: string };

interface ProductGalleryProps {
  images: string[];
  videoUrl?: string;
  alt: string;
}

export default function ProductGallery({ images, videoUrl, alt }: ProductGalleryProps) {
  const media: MediaItem[] = [
    ...images.map((src): MediaItem => ({ type: "image", src })),
    ...(videoUrl ? [{ type: "video", src: videoUrl } as MediaItem] : []),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<{ transformOrigin: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const active = media[activeIndex] ?? media[0];

  function goTo(index: number) {
    setActiveIndex((index + media.length) % media.length);
  }

  function handleMouseMove(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {media.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:w-20 sm:flex-col sm:overflow-y-auto">
          {media.map((item, index) => (
            <button
              key={item.src + index}
              type="button"
              onClick={() => goTo(index)}
              className={[
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:w-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright focus-visible:ring-offset-2 focus-visible:ring-offset-nixon-bg",
                index === activeIndex
                  ? "border-nixon-crimson-bright"
                  : "border-transparent hover:border-nixon-border",
              ].join(" ")}
              aria-label={`Ver ${item.type === "video" ? "video" : `foto ${index + 1}`} de ${alt}`}
            >
              {item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-nixon-bg-deep text-nixon-ink">
                  <PlayIcon />
                </div>
              ) : (
                <Image
                  src={item.src}
                  alt={`${alt} — foto ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="group relative order-1 aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-nixon-surface sm:order-2">
        {active.type === "video" ? (
          <video
            key={active.src}
            src={active.src}
            controls
            playsInline
            className="h-full w-full object-contain bg-black"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Ampliar foto de ${alt}`}
            className="block h-full w-full cursor-zoom-in overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomStyle(null)}
          >
            <Image
              key={active.src}
              src={active.src}
              alt={alt}
              fill
              priority={activeIndex === 0}
              sizes="(max-width: 640px) 100vw, 55vw"
              style={zoomStyle ?? undefined}
              className={[
                "object-cover object-center transition-transform duration-200 ease-out",
                zoomStyle ? "scale-[1.8]" : "scale-100",
              ].join(" ")}
            />
          </button>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-nixon-bg-deep/70 text-nixon-ink opacity-0 transition-all duration-300 hover:bg-nixon-crimson group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-nixon-bg-deep/70 text-nixon-ink opacity-0 transition-all duration-300 hover:bg-nixon-crimson group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright"
            >
              <ArrowIcon direction="right" />
            </button>
          </>
        )}
      </div>

      {active.type === "image" && (
        <ImageLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          src={active.src}
          alt={alt}
          hasMultiple={media.length > 1}
          onPrev={() => goTo(activeIndex - 1)}
          onNext={() => goTo(activeIndex + 1)}
        />
      )}
    </div>
  );
}

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  hasMultiple: boolean;
  onPrev: () => void;
  onNext: () => void;
}

// Visor a pantalla completa al hacer click en la imagen principal — mismo
// patrón de modal que SizeGuideModal.tsx (backdrop-blur + role="dialog")
// y el manejo de foco/teclado de CartDrawer.tsx (guarda y devuelve el foco,
// bloquea el scroll del body mientras está abierto, Escape cierra). La
// imagen conserva el mismo efecto de zoom al hover ("lupa") que ya tiene
// la vista inline, ahora sobre la versión ampliada.
function ImageLightbox({ open, onClose, src, alt, hasMultiple, onPrev, onNext }: ImageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [zoomStyle, setZoomStyle] = useState<{ transformOrigin: string } | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (hasMultiple && event.key === "ArrowLeft") onPrev();
      if (hasMultiple && event.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, onPrev, onNext, hasMultiple]);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  }

  // Portal directo a document.body: renderizado dentro del arbol de la PDP
  // (adentro del wrapper `lg:sticky` de la galeria), el z-[70] quedaba
  // atrapado dentro del stacking context de ese ancestro y no lograba
  // taparse por encima del navbar (z-40) a pesar de tener un z-index mayor
  // en numero — bug real visto en produccion (el navbar quedaba nitido
  // arriba del overlay difuminado). El portal escapa de cualquier
  // ancestro y deja al lightbox comparando z-index directo contra el
  // resto de la pagina, igual que CartDrawer/WhatsappButton, montados
  // directo en SiteShell en vez de adentro de una pagina especifica.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ampliada de ${alt}`}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen ampliada"
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-nixon-bg-deep/80 text-nixon-ink transition-colors hover:bg-nixon-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright sm:right-6 sm:top-6"
      >
        <CloseIcon />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-nixon-bg-deep/80 text-nixon-ink transition-colors hover:bg-nixon-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright sm:left-6"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-nixon-bg-deep/80 text-nixon-ink transition-colors hover:bg-nixon-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nixon-crimson-bright sm:right-6"
          >
            <ArrowIcon direction="right" />
          </button>
        </>
      )}

      <div
        className="relative aspect-[4/5] h-full max-h-[85vh] w-auto max-w-[90vw] cursor-zoom-in overflow-hidden rounded-2xl shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomStyle(null)}
      >
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="90vw"
          style={zoomStyle ?? undefined}
          className={[
            "object-contain transition-transform duration-200 ease-out",
            zoomStyle ? "scale-[1.8]" : "scale-100",
          ].join(" ")}
        />
      </div>
    </div>,
    document.body
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
