import { NextRequest, NextResponse } from "next/server";
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

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || "",
        price: parseFloat(data.price),
        image: data.image,
        category: data.category || "remera",
        stock: data.stock ?? 0,
        seo: data.seo,
      },
    });

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
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  }
}
