import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">404 - Página no encontrada</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        La página que buscas no existe.
      </p>
      <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}
