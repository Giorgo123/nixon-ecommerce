import prisma from "@/lib/prisma";
import type { Product } from "@/features/products/types";

const variantsInclude = { variants: { orderBy: [{ size: "asc" as const }, { color: "asc" as const }] } };

export async function getCatalogProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: variantsInclude,
  });
  return products.map(toProduct);
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: variantsInclude,
  });
  return product ? toProduct(product) : null;
}

export async function getCatalogCategories() {
  const products = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] });
  return products.map((product) => product.category);
}

function toProduct(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  slug: string;
  seo: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants: Array<{ id: string; size: string | null; color: string | null; stock: number }>;
}): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category as Product["category"],
    slug: product.slug,
    seo: product.seo ?? undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    variants: product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
  };
}
