export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{slug}</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        Placeholder del detalle. Próximo: galería + talles + agregar al carrito.
      </p>
    </main>
  );
}
