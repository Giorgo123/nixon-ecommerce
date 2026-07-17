import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function AdminCreateProductPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/products"
        className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        ← Volver a productos
      </Link>
      <h1 className="mt-4 mb-8 text-2xl font-semibold tracking-tight text-black dark:text-white">
        Nuevo producto
      </h1>
      <ProductForm mode="create" />
    </main>
  );
}
