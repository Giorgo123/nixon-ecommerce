import prisma from "@/lib/prisma";
import type { Product } from "@/features/products/types";
import { normalizeCategory } from "@/lib/categories";

const productInclude = {
  variants: { orderBy: [{ size: "asc" as const }, { color: "asc" as const }] },
  images: { orderBy: { position: "asc" as const } },
};

export async function getCatalogProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: productInclude,
  });
  return products.map(toProduct);
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  });
  return product ? toProduct(product) : null;
}

export async function getCatalogCategories() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { category: true },
    distinct: ["category"],
  });
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
