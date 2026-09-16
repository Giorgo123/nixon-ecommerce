export default function BrandManifesto() {
  return (
    <section className="border-y border-black/10 bg-black py-20 dark:border-white/10 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
          Nixon Studio
        </p>
        <h2 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
          No vendemos remeras.
          <br />
          Vendemos una estética.
        </h2>
        <p className="mt-6 text-base leading-relaxed text-zinc-400">
          Streetwear oversize y dark art pensados para durar: algodón peinado de
          alto gramaje, estampa serigráfica de alta densidad, y diseños que no
          vas a ver en cualquier lado. Operamos desde Villa María, Córdoba, con
          envío gratis a todo el país.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Elegimos calidad de tela y de impresión antes que precio de oferta —
          por eso cada pieza pasa por selección y control antes de salir.
        </p>
      </div>
    </section>
  );
}
