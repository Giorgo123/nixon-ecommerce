import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/products"
        className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        ← Volver a productos
      </Link>

      <div className="mt-4 mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
          Editar producto
        </h1>
        <DeleteProductButton productId={product.id} productName={product.name} />
      </div>

      <ProductForm
        mode="edit"
        product={{
          ...product,
          category: product.category as "remera" | "oversize" | "buzo" | "taza" | "poster",
          seo: product.seo ?? undefined,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        }}
      />
    </main>
  );
}
