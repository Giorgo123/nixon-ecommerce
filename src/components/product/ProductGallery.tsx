"use client";

import { useState, type MouseEvent } from "react";
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
  const active = media[activeIndex] ?? media[0];

  function goTo(index: number) {
    setActiveIndex((index + media.length) % media.length);
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
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
                index === activeIndex
                  ? "border-red-500"
                  : "border-transparent hover:border-black/20 dark:hover:border-white/20",
              ].join(" ")}
              aria-label={`Ver ${item.type === "video" ? "video" : `foto ${index + 1}`} de ${alt}`}
            >
              {item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                  <PlayIcon />
                </div>
              ) : (
                <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="group relative order-1 aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-black/5 dark:bg-white/5 sm:order-2">
        {active.type === "video" ? (
          <video
            key={active.src}
            src={active.src}
            controls
            playsInline
            className="h-full w-full object-contain bg-black"
          />
        ) : (
          <div
            className="h-full w-full cursor-zoom-in overflow-hidden"
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
          </div>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ArrowIcon direction="right" />
            </button>
          </>
        )}
      </div>
    </div>
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
