import Image from "next/image";
import { SOCIAL_LINKS } from "@/lib/constants/social";
import type { Product } from "@/features/products/types";

interface LookbookProps {
  products: Product[];
}

interface LookbookPhoto {
  key: string;
  src: string;
  alt: string;
}

const MAX_PHOTOS = 6;

// Arma hasta MAX_PHOTOS fotos únicas usando solo imágenes que ya existen en
// el catálogo (portada de producto o primera foto de galería) — nunca
// inventa URLs nuevas. Si varios productos comparten portada (pasa cuando
// hay productos con `image` repetida), evita duplicarla en el grid y en su
// lugar suma variedad recurriendo a `product.images[0]`.
function collectLookbookPhotos(products: Product[]): LookbookPhoto[] {
  const seen = new Set<string>();
  const photos: LookbookPhoto[] = [];

  const tryAdd = (src: string | undefined, key: string, alt: string) => {
    if (!src || seen.has(src) || photos.length >= MAX_PHOTOS) return;
    seen.add(src);
    photos.push({ key, src, alt });
  };

  // Primera pasada: portada de cada producto, para cubrir la mayor
  // variedad de productos distintos posible.
  for (const product of products) {
    if (photos.length >= MAX_PHOTOS) break;
    tryAdd(product.image, `${product.id}-cover`, product.name);
  }

  // Si quedaron menos de MAX_PHOTOS (portadas repetidas o poco catálogo),
  // completamos con fotos de galería de los mismos productos para seguir
  // sumando variedad real sin repetir imagen.
  if (photos.length < MAX_PHOTOS) {
    for (const product of products) {
      if (photos.length >= MAX_PHOTOS) break;
      tryAdd(product.images[0], `${product.id}-gallery`, product.name);
    }
  }

  return photos;
}

// Fotos reales de producto (las mismas que ya se usan en el catálogo), no
// contenido de Instagram inventado — funciona como vidriera y linkea a la
// cuenta real.
export default function Lookbook({ products }: LookbookProps) {
  const images = collectLookbookPhotos(products);

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
        {images.map((photo) => (
          <a
            key={photo.key}
            href={SOCIAL_LINKS.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-black/5 dark:bg-white/5"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              // Grid fijo de 3 columnas en todos los breakpoints (no cambia
              // de cantidad de columnas en mobile/desktop), acotado por el
              // contenedor max-w-6xl: la celda real ronda 1/3 del viewport
              // en mobile y hasta ~380px una vez que el contenedor topea en
              // desktop. 16vw subestimaba el ancho real en pantallas
              // grandes (Next servía una imagen más chica de lo renderizado
              // → se veía pixelada); esto sirve la resolución correcta.
              sizes="(min-width: 640px) 380px, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
