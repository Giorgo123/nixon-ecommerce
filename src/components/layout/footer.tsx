import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 py-10 text-sm text-black/70 dark:border-white/10 dark:text-white/70">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="tracking-wide">© {new Date().getFullYear()} Nixon Studio</p>
          <p className="tracking-wide">
            Instagram: <span className="text-black dark:text-white">@nixonstudio</span>
          </p>
        </div>

        <nav className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-black/10 pt-6 text-xs uppercase tracking-[0.15em] dark:border-white/10">
          <Link href="/terminos-y-condiciones" className="hover:text-black dark:hover:text-white">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-black dark:hover:text-white">
            Privacidad
          </Link>
          <Link href="/cambios-y-devoluciones" className="hover:text-black dark:hover:text-white">
            Cambios y Devoluciones
          </Link>
          <Link href="/cambios-y-devoluciones" className="font-bold text-red-500 hover:text-red-600">
            Botón de Arrepentimiento
          </Link>
        </nav>
      </div>
    </footer>
  );
}
