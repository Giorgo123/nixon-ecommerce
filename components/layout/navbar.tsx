import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/50">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.22em] uppercase"
        >
          Nixon Studio
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/products" className="hover:opacity-70">
            Catálogo
          </Link>
          <Link href="/cart" className="hover:opacity-70">
            Carrito
          </Link>
          <Link href="/admin/login" className="hover:opacity-70">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
