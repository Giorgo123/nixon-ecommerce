import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");

    let products;

    if (slug) {
      // Buscar producto por slug
      try {
        const product = await prisma.product.findUnique({
          where: { slug },
        });
        if (product) return NextResponse.json(product);
      } catch {
        // Fallback a JSON
        const product = getCatalogProductBySlug(slug);
        return NextResponse.json(product || null);
      }
    }

    if (category) {
      // Filtrar por categoría
      try {
        products = await prisma.product.findMany({
          where: { category },
          orderBy: { createdAt: "desc" },
        });
      } catch {
        // Fallback a JSON
        products = getCatalogProducts().filter((product) => product.category === category);
      }
    } else {
      // Obtener todos los productos
      try {
        products = await prisma.product.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch {
        // Fallback a JSON
        products = getCatalogProducts();
      }
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    // Último fallback
    return NextResponse.json(getCatalogProducts());
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validar campos requeridos
    if (!data.name || !data.price || !data.slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
