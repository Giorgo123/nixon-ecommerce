"use client";

import { useEffect } from "react";
import Link from "next/link";
import { isDatabaseConnectionError } from "@/lib/db-safe";

// Cubre todas las rutas del sitio (no el layout raiz). Sin este archivo, un
// fallo puntual de la base de datos -tipico cuando la DB es remota y hay un
// corte de red- devolvia un 500 crudo con el stack de Prisma y dejaba al
// visitante sin pagina. El patron que ya usaba el admin
// (`isDatabaseConnectionError` en admin/dashboard y admin/orders) se aplica
// aca de forma explicita para distinguir el corte de DB de cualquier otro
// error y ofrecer el reintento que corresponde.
export default function StorefrontError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const databaseUnavailable = isDatabaseConnectionError(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
      <p className="text-xs uppercase tracking-[0.3em] text-red-500">
        {databaseUnavailable ? "Sin conexión" : "Error"}
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
        {databaseUnavailable
          ? "No pudimos cargar la tienda"
          : "Algo salió mal"}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-black/70 dark:text-white/70">
        {databaseUnavailable
          ? "La base de datos no responde en este momento. Suele ser un corte de conexión pasajero: probá de nuevo en unos segundos."
          : "Ocurrió un error inesperado al armar esta página. Podés reintentar o volver al inicio."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black dark:border-white/10 dark:text-white"
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

      {process.env.NODE_ENV !== "production" && error.digest && (
        <p className="mt-8 text-xs text-black/40 dark:text-white/40">
          digest: {error.digest}
        </p>
      )}
    </main>
  );
}
