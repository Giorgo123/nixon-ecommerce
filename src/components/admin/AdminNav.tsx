"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

const linkClasses =
  "rounded-full border border-black/10 px-3 py-2 font-medium text-black dark:border-white/10 dark:text-white";

export default function AdminNav() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/" className={linkClasses}>
        Ver sitio
      </Link>
      {!isLoginPage && (
        <>
          <Link href="/admin/dashboard" className={linkClasses}>
            Dashboard
          </Link>
          <Link href="/admin/products" className={linkClasses}>
            Productos
          </Link>
          <Link href="/admin/orders" className={linkClasses}>
            Pedidos
          </Link>
          <AdminLogoutButton />
        </>
      )}
    </nav>
  );
}
