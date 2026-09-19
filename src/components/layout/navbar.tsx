"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import useCartStore from "@/store/cart.store";
import PromoBar from "@/components/layout/PromoBar";
import { productCategories, catalogFilterLabels } from "@/lib/categories";

const subscribeNoop = () => () => {};

// Distancia mínima de scroll entre cambios de dirección para evitar
// parpadeo por jitter (trackpads, rebote de rueda, etc.).
const SCROLL_DIRECTION_THRESHOLD = 4;

const catalogLinks = [
  ...productCategories.map((category) => ({
    href: `/products?category=${category}`,
    label: catalogFilterLabels[category] ?? category,
  })),
  { href: "/products", label: "Ver todo" },
];

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
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catalogOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setCatalogOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCatalogOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [catalogOpen]);

  const reduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Con reduced motion, el header queda siempre visible, sin animación.
    if (reduceMotion) {
      if (headerHidden) setHeaderHidden(false);
      lastScrollY.current = latest;
      return;
    }

    const headerHeight = headerRef.current?.offsetHeight ?? 64;
    const previous = lastScrollY.current;
    const delta = latest - previous;

    // No ocultar cerca del tope de la página, para evitar parpadeo.
    if (latest < headerHeight) {
      setHeaderHidden(false);
    } else if (Math.abs(delta) > SCROLL_DIRECTION_THRESHOLD) {
      setHeaderHidden(delta > 0);
    }

    lastScrollY.current = latest;
  });

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchValue.trim();
    setSearchOpen(false);
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <div className="sticky top-0 z-40">
      <div className="relative z-10">
        <PromoBar />
      </div>
      <motion.header
        ref={headerRef}
        animate={reduceMotion ? { y: "0%" } : { y: headerHidden ? "-100%" : "0%" }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative border-b border-nixon-border bg-nixon-bg/95 backdrop-blur"
      >
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
            <div
              ref={catalogRef}
              className="relative"
              onMouseEnter={() => setCatalogOpen(true)}
              onMouseLeave={() => setCatalogOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCatalogOpen((open) => !open)}
                aria-expanded={catalogOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 transition-colors hover:text-nixon-crimson-bright"
              >
                Catálogo
                <ChevronIcon open={catalogOpen} />
              </button>

              {catalogOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-nixon-border bg-nixon-surface py-2 shadow-lg shadow-black/40"
                >
                  {catalogLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setCatalogOpen(false)}
                      className="block px-4 py-2.5 text-sm text-nixon-ink-dim transition-colors hover:bg-nixon-bg hover:text-nixon-crimson-bright"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/contacto" className="transition-colors hover:text-nixon-crimson-bright">
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop: barra de búsqueda siempre visible, ícono de lupa
                DENTRO del campo a la izquierda (no un botón que abre otra
                cosa). Fondo gris claro a propósito, distinto del resto de
                la navbar oscura — es un control funcional, no una pieza de
                identidad de marca. */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar"
                aria-label="Buscar productos"
                className="h-10 w-40 rounded-full border-0 bg-gray-100 pl-9 pr-4 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nixon-crimson-bright lg:w-56"
              />
            </form>

            {/* Mobile: no entra una barra fija junto al logo/carrito — se
                mantiene el ícono que despliega el mismo campo, con el
                mismo estilo visual que la versión de desktop. */}
            <div className="relative flex items-center sm:hidden">
              {searchOpen && (
                <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    autoFocus
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onBlur={() => !searchValue && setSearchOpen(false)}
                    placeholder="Buscar"
                    aria-label="Buscar productos"
                    className="h-10 w-48 rounded-full border-0 bg-gray-100 pl-9 pr-4 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nixon-crimson-bright"
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
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-nixon-border px-4 py-3 text-sm font-medium text-nixon-ink-dim sm:hidden">
            <button
              type="button"
              onClick={() => setMobileCatalogOpen((open) => !open)}
              aria-expanded={mobileCatalogOpen}
              className="flex items-center justify-between rounded-lg px-2 py-3 text-left hover:bg-nixon-surface hover:text-nixon-crimson-bright"
            >
              Catálogo
              <ChevronIcon open={mobileCatalogOpen} />
            </button>
            {mobileCatalogOpen && (
              <div className="flex flex-col gap-1 pl-4">
                {catalogLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setMenuOpen(false);
                      setMobileCatalogOpen(false);
                    }}
                    className="rounded-lg px-2 py-2.5 text-sm text-nixon-muted hover:bg-nixon-surface hover:text-nixon-crimson-bright"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/contacto"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-3 hover:bg-nixon-surface hover:text-nixon-crimson-bright"
            >
              Contacto
            </Link>
          </nav>
        )}
      </motion.header>
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
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
