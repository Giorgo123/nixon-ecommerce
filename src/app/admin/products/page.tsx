import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { catalogCategoryLabels } from "@/lib/categories";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import Pagination from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { variants: true },
    }),
    prisma.product.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
            Productos
          </h1>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            {totalProducts} producto{totalProducts === 1 ? "" : "s"} en el catálogo
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          Nuevo producto
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-xs uppercase tracking-wider text-black/60 dark:bg-white/5 dark:text-white/60">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                      <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-black dark:text-white">{product.name}</p>
                      <p className="text-xs text-black/50 dark:text-white/50">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-black/70 dark:text-white/70">
                  {catalogCategoryLabels[product.category] ?? product.category}
                </td>
                <td className="px-4 py-3 text-black/70 dark:text-white/70">
                  ${product.price.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-black/70 dark:text-white/70">
                  {product.variants.reduce((sum, v) => sum + v.stock, 0)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:border-black/30 dark:border-white/10 dark:text-white dark:hover:border-white/30"
                    >
                      Editar
                    </Link>
                    <DeleteProductButton productId={product.id} productName={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination basePath="/admin/products" currentPage={page} totalPages={totalPages} />
    </main>
  );
}
