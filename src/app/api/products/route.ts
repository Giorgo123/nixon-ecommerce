import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/catalog";

async function getPrisma() {
  const { default: prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");
    const catalogProducts = getCatalogProducts();

    if (slug) {
      return NextResponse.json(getCatalogProductBySlug(slug) || null);
    }

    if (category) {
      return NextResponse.json(
        catalogProducts.filter((product) => product.category === category)
      );
    }

    return NextResponse.json(catalogProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(getCatalogProducts());
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.name || !data.price || !data.slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || "",
        price: parseFloat(data.price),
        image: data.image || "",
        category: data.category || "remera",
        stock: data.stock || 0,
        slug: data.slug,
        seo: data.seo,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}
