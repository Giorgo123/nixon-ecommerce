import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/catalog";
import { isDatabaseConnectionError } from "@/lib/db-safe";
import { isAdminSessionActive } from "@/lib/admin-session";
import { slugify } from "@/lib/utils";
import prisma from "@/lib/prisma";

async function uniqueSlugFromName(name: string) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");

    if (slug) {
      return NextResponse.json(await getCatalogProductBySlug(slug));
    }

    const catalogProducts = await getCatalogProducts();

    if (category) {
      return NextResponse.json(
        catalogProducts.filter((product) => product.category === category)
      );
    }

    return NextResponse.json(catalogProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "No se pudo conectar a la base de datos" }, { status: 503 });
    }
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.name || !data.price || !data.image) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = await uniqueSlugFromName(data.name);

    const incomingVariants: Array<{ size?: string | null; stock?: number }> =
      Array.isArray(data.variants) && data.variants.length > 0
        ? data.variants
        : [{ size: null, stock: 0 }];

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || "",
        price: parseFloat(data.price),
        image: data.image,
        category: data.category || "remera",
        slug,
        seo: data.seo,
        variants: {
          create: incomingVariants.map((v) => ({ size: v.size ?? null, stock: v.stock ?? 0 })),
        },
      },
      include: { variants: true },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}
