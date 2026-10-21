// Punto unico de verdad para URLs absolutas y defaults de SEO/Open Graph.
// metadataBase en layout.tsx ya resuelve el origen para rutas relativas, pero
// las URLs que se emiten a Search Console, sitemap y JSON-LD necesitan ser
// absolutas en el propio string, y varios tests necesitan esta misma logica
// sin depender del entorno de Next.

export const DEFAULT_SITE_URL = "https://nixonstudio.com.ar";

// Mismo fallback que layout.tsx / sitemap.ts / robots.ts: en local sin
// NEXT_PUBLIC_SITE_URL el sitio se sirve en localhost, pero cualquier URL
// publica (canonical, sitemap, JSON-LD) cae al dominio de produccion.
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export const SITE_NAME = "Nixon Studio";

export const DEFAULT_OG_IMAGE = "/opengraph-image";

export const DEFAULT_DESCRIPTION =
  "Ecommerce Nixon Studio: remeras oversize, streetwear y dark art.";

// Open Graph/Twitter por defecto para toda pagina publica que no defina uno
// propio. El tipo `website` y locale es_AR son los correctos para esta tienda
// (una sola region, Argentina). `images` apunta a la imagen OG generada en
// src/app/opengraph-image.tsx; Next la publica en /opengraph-image.
export function defaultOpenGraph() {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: "es_AR",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  };
}

export function defaultTwitter() {
  return {
    card: "summary_large_image" as const,
    images: [DEFAULT_OG_IMAGE],
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

// BreadcrumbList de schema.org a partir de una lista ordenada de items
// (home siempre primero). Cada `path` se vuelve absoluto con el dominio real,
// asi el JSON-LD nunca referencia rutas relativas ni inventa URLs.
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
