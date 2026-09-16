import Image from "next/image";
import { SOCIAL_LINKS } from "@/lib/constants/social";
import type { Product } from "@/features/products/types";

interface LookbookProps {
  products: Product[];
}

// Fotos reales de producto (las mismas que ya se usan en el catálogo), no
// contenido de Instagram inventado — funciona como vidriera y linkea a la
// cuenta real.
export default function Lookbook({ products }: LookbookProps) {
  const images = products.slice(0, 6);

  if (images.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
          Seguinos en Instagram
        </h2>
        <a
          href={SOCIAL_LINKS.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:border-red-500/50 hover:text-red-500 dark:border-white/10 dark:text-white"
        >
          {SOCIAL_LINKS.instagram.handle}
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {images.map((product) => (
          <a
            key={product.id}
            href={SOCIAL_LINKS.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-black/5 dark:bg-white/5"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 16vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
