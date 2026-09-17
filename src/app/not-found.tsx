import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
      <p className="text-xs uppercase tracking-[0.3em] text-red-500">Error 404</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
        Esta página no existe
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-black/70 dark:text-white/70">
        Puede que el link esté roto o que el producto ya no esté disponible. Volvé al inicio o
        seguí explorando el catálogo.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Volver al inicio
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black dark:border-white/10 dark:text-white"
        >
          Ver catálogo
        </Link>
      </div>
    </main>
  );
}
