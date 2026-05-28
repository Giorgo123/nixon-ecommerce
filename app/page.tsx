export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/60 dark:text-white/60">
            Premium Streetwear
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Remeras oversize con identidad.
          </h1>
          <p className="max-w-prose text-base leading-7 text-black/70 dark:text-white/70">
            Anime, dark art y streetwear. Materiales premium, fit real oversize y
            drop constante.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
            >
              Ver catálogo
            </a>
            <a
              href="#instagram"
              className="inline-flex h-12 items-center justify-center rounded-full border border-black/20 px-6 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Ver Instagram
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-8 dark:border-white/10 dark:bg-white/5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/60 dark:text-white/60">
              Highlight
            </p>
            <p className="text-lg font-semibold">Oversize — Heavy Cotton</p>
            <p className="text-sm text-black/70 dark:text-white/70">
              Placeholder visual (después lo conectamos con fotos reales en
              `public/hero`).
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Destacados</h2>
          <a href="/products" className="text-sm font-semibold hover:opacity-70">
            Ver todo
          </a>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-black/10 p-4 dark:border-white/10"
            >
              <div className="aspect-square w-full rounded-xl bg-black/[0.05] dark:bg-white/10" />
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold">Remera Oversize</p>
                <p className="text-sm text-black/70 dark:text-white/70">
                  $ 00.000
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="instagram"
        className="mt-16 border-t border-black/10 pt-10 dark:border-white/10"
      >
        <h2 className="text-xl font-semibold tracking-tight">Instagram</h2>
        <p className="mt-2 max-w-prose text-sm text-black/70 dark:text-white/70">
          Acá va el bloque de integración (embeds o grid). Por ahora dejamos el
          placeholder.
        </p>
      </section>
    </main>
  );
}
