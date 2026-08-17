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

  const incomingImages: string[] = Array.isArray(data.images) ? data.images : [];

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || "",
          price: parseFloat(data.price),
          compareAtPrice:
            data.compareAtPrice !== undefined && data.compareAtPrice !== ""
              ? parseFloat(data.compareAtPrice)
              : null,
          image: data.image,
          videoUrl: data.videoUrl || null,
          category: data.category || "remera",
          seo: data.seo,
          isFeatured: Boolean(data.isFeatured),
          materials: data.materials || null,
          careInstructions: data.careInstructions || null,
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

      // Las imagenes de galeria no tienen historial de pedidos apuntandoles
      // (a diferencia de las variantes), asi que borrar y recrear es seguro.
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (incomingImages.length > 0) {
        await tx.productImage.createMany({
          data: incomingImages.map((url, index) => ({ url, position: index, productId: id })),
        });
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: { variants: true, images: true } });
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}

// Borrado real y definitivo. OrderItem->ProductVariant es restrictivo a
// proposito, asi que si el producto ya tuvo pedidos hay que borrar esas
// lineas de pedido primero (se pierde ese detalle historico) para poder
// borrar el producto. Si se quiere conservar el historial, usar "Ocultar"
// (PATCH active:false) en vez de este endpoint.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { variant: { productId: id } } });
      return tx.product.delete({ where: { id } });
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json({ ok: true, mode: "deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "No se pudo borrar el producto" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  if (typeof data.active !== "boolean") {
    return NextResponse.json({ error: "Missing active field" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({ where: { id }, data: { active: data.active } });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating product active state:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}
