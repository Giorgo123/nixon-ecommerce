"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useSyncExternalStore } from "react";
import useCartStore from "@/store/cart.store";
import PromoBar from "@/components/layout/PromoBar";

const subscribeNoop = () => () => {};

export default function Navbar() {
  const router = useRouter();
  const itemsCount = useCartStore((state) => state.getItemsCount());
  const openDrawer = useCartStore((state) => state.openDrawer);
  // The cart is persisted to localStorage, so its real value is only known
  // after hydration; render the server/first-paint snapshot (false) until then.
  const hasMounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchValue.trim();
    setSearchOpen(false);
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <div className="sticky top-0 z-40">
      <PromoBar />
      <header className="border-b border-nixon-border bg-nixon-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-nixon-ink-dim sm:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>

          <Link
            href="/"
            className="shrink-0 text-sm font-black tracking-[0.22em] text-nixon-ink uppercase"
          >
            Nixon Studio
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-nixon-ink-dim sm:flex">
            <Link href="/products" className="transition-colors hover:text-nixon-crimson-bright">
              Catálogo
            </Link>
            <Link href="/contacto" className="transition-colors hover:text-nixon-crimson-bright">
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative flex items-center">
              {searchOpen && (
                <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2">
                  <input
                    type="search"
                    autoFocus
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onBlur={() => !searchValue && setSearchOpen(false)}
                    placeholder="Buscar productos..."
                    aria-label="Buscar productos"
                    className="h-11 w-48 rounded-full border border-nixon-border bg-nixon-surface px-4 text-sm text-nixon-ink placeholder:text-nixon-muted focus:border-nixon-crimson focus:outline-none sm:w-64"
                  />
                </form>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                aria-label="Buscar"
                aria-expanded={searchOpen}
                className={[
                  "flex h-11 w-11 items-center justify-center rounded-full text-nixon-ink-dim transition-colors hover:text-nixon-crimson-bright",
                  searchOpen ? "invisible" : "visible",
                ].join(" ")}
              >
                <SearchIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={openDrawer}
              aria-label="Abrir carrito"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-nixon-ink-dim transition-colors hover:text-nixon-crimson-bright"
            >
              <CartIcon />
              {hasMounted && itemsCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-nixon-crimson px-1 text-[10px] font-bold text-white">
                  {itemsCount}
                </span>
              )}
            </button>

            <Link
              href="/admin/login"
              aria-label="Acceso administrador"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-nixon-muted transition-colors hover:text-nixon-crimson-bright sm:flex"
            >
              <LockIcon />
            </Link>
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-nixon-border px-4 py-3 text-sm font-medium text-nixon-ink-dim sm:hidden">
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-3 hover:bg-nixon-surface hover:text-nixon-crimson-bright"
            >
              Catálogo
            </Link>
            <Link
              href="/contacto"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-3 hover:bg-nixon-surface hover:text-nixon-crimson-bright"
            >
              Contacto
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-3 text-nixon-muted hover:bg-nixon-surface"
            >
              Acceso administrador
            </Link>
          </nav>
        )}
      </header>
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
