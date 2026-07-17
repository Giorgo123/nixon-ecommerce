import prisma from "@/lib/prisma";
import type { Product } from "@/features/products/types";

export async function getCatalogProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return products.map(toProduct);
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({ where: { slug } });
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
  stock: number;
  seo: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category as Product["category"],
    slug: product.slug,
    stock: product.stock,
    seo: product.seo ?? undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
