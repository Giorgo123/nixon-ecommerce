"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black/5 dark:bg-white/5">
        <Image
          key={activeImage}
          src={activeImage}
          alt={alt}
          fill
          priority={activeIndex === 0}
          className="object-cover object-center"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={[
                "relative aspect-square overflow-hidden rounded-xl border-2 transition-colors",
                index === activeIndex
                  ? "border-red-500"
                  : "border-transparent hover:border-black/20 dark:hover:border-white/20",
              ].join(" ")}
              aria-label={`Ver foto ${index + 1} de ${alt}`}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
