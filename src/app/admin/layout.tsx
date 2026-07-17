import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[calc(100vh-0px)] bg-white text-black dark:bg-black dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">
              Admin
            </p>
            <p className="text-sm font-semibold text-black dark:text-white">
              Nixon Studio
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-black/10 px-3 py-2 font-medium text-black dark:border-white/10 dark:text-white"
            >
              Ver sitio
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-black/10 px-3 py-2 font-medium text-black dark:border-white/10 dark:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="rounded-full border border-black/10 px-3 py-2 font-medium text-black dark:border-white/10 dark:text-white"
            >
              Productos
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-full border border-black/10 px-3 py-2 font-medium text-black dark:border-white/10 dark:text-white"
            >
              Pedidos
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
