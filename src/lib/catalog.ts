import prisma from "@/lib/prisma";
import type { Product } from "@/features/products/types";
import { normalizeCategory } from "@/lib/categories";
import { isDatabaseConnectionError } from "@/lib/db-safe";

const productInclude = {
  variants: { orderBy: [{ size: "asc" as const }, { color: "asc" as const }] },
  images: { orderBy: { position: "asc" as const } },
};

const READ_RETRY_ATTEMPTS = 3;
const READ_RETRY_DELAY_MS = 500;

// La base es un Postgres remoto detrás del proxy de Railway, que de vez en
// cuando corta la conexión a mitad del handshake (P1011) o cierra el socket
// sin avisar (P1017), y que además tarda en contestar cuando está frío (P1001).
// Son fallos transitorios: la misma consulta reintentada un instante después
// va bien. Sin esto, una de esas caídas tumbaba el PDP entero con un 500, y
// durante el build rompía el prerender de los PDP, porque Next genera las
// páginas en paralelo y golpea la base con varias conexiones a la vez.
//
// Solo se reintenta en lecturas y solo ante errores de conexión: nunca ante un
// error de datos (por ejemplo una violación de unique) y nunca en escrituras,
// donde reintentar podría duplicar una orden o un pago.
async function withConnectionRetry<T>(query: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await query();
    } catch (error) {
      const isLastAttempt = attempt >= READ_RETRY_ATTEMPTS;
      if (isLastAttempt || !isDatabaseConnectionError(error)) throw error;

      await new Promise((resolve) => setTimeout(resolve, READ_RETRY_DELAY_MS * attempt));
    }
  }
}

export async function getCatalogProducts(): Promise<Product[]> {
  const products = await withConnectionRetry(() =>
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: productInclude,
    })
  );
  return products.map(toProduct);
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  const product = await withConnectionRetry(() =>
    prisma.product.findFirst({
      where: { slug, active: true },
      include: productInclude,
    })
  );
  return product ? toProduct(product) : null;
}

export async function getCatalogCategories() {
  const products = await withConnectionRetry(() =>
    prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ["category"],
    })
  );
  // Normaliza antes de dedupear para que "remera" y el legado "oversize" no
  // aparezcan como dos categorias separadas en el catalogo.
  const normalized = products.map((product) => normalizeCategory(product.category));
  return Array.from(new Set(normalized));
}

function toProduct(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  videoUrl: string | null;
  category: string;
  slug: string;
  seo: string | null;
  isFeatured: boolean;
  materials: string | null;
  careInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants: Array<{ id: string; size: string | null; color: string | null; stock: number }>;
  images: Array<{ url: string }>;
}): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    image: product.image,
    videoUrl: product.videoUrl ?? undefined,
    category: product.category as Product["category"],
    slug: product.slug,
    seo: product.seo ?? undefined,
    isFeatured: product.isFeatured,
    materials: product.materials ?? undefined,
    careInstructions: product.careInstructions ?? undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    variants: product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
    images: product.images.map((i) => i.url),
  };
}
