import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { isAdminSessionActive } from "@/lib/admin-session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  if (!data.name || !data.price || !data.image) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const incomingVariants: Array<{ size?: string | null; stock?: number }> =
    Array.isArray(data.variants) && data.variants.length > 0
      ? data.variants
      : [{ size: null, stock: 0 }];

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || "",
          price: parseFloat(data.price),
          image: data.image,
          category: data.category || "remera",
          seo: data.seo,
        },
      });

      // Prisma no soporta el shorthand de upsert por clave compuesta cuando
      // alguno de los campos es NULL (size/color acá), asi que matcheamos a
      // mano contra las variantes existentes en vez de usar upsert().
      const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
      const incomingKeys = new Set(incomingVariants.map((v) => `${v.size ?? ""}`));

      for (const v of incomingVariants) {
        const size = v.size ?? null;
        const match = existingVariants.find((ev) => ev.size === size);

        if (match) {
          await tx.productVariant.update({ where: { id: match.id }, data: { stock: v.stock ?? 0 } });
        } else {
          await tx.productVariant.create({
            data: { productId: id, size, color: null, stock: v.stock ?? 0 },
          });
        }
      }

      // Talles que ya no vienen en el formulario: se dejan en stock 0 en vez
      // de borrarlos, para no romper el historial de OrderItem que los
      // referencia.
      for (const existing of existingVariants) {
        if (!incomingKeys.has(existing.size ?? "")) {
          await tx.productVariant.update({ where: { id: existing.id }, data: { stock: 0 } });
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: { variants: true } });
    });

    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const product = await prisma.product.delete({ where: { id } });

    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  }
}
