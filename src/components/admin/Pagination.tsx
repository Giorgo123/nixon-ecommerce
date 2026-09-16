import Link from "next/link";

interface PaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  /** Extra query params (e.g. active filters) to preserve across page links. */
  queryParams?: Record<string, string | undefined>;
}

function buildHref(basePath: string, page: number, queryParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) params.set(key, value);
    }
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export default function Pagination({ basePath, currentPage, totalPages, queryParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <Link
        href={buildHref(basePath, prevPage, queryParams)}
        aria-disabled={currentPage === 1}
        className={[
          "rounded-full border border-black/10 px-4 py-2 font-medium text-black dark:border-white/10 dark:text-white",
          currentPage === 1 ? "pointer-events-none opacity-40" : "hover:border-black/30 dark:hover:border-white/30",
        ].join(" ")}
      >
        ← Anterior
      </Link>
      <p className="text-black/60 dark:text-white/60">
        Página {currentPage} de {totalPages}
      </p>
      <Link
        href={buildHref(basePath, nextPage, queryParams)}
        aria-disabled={currentPage === totalPages}
        className={[
          "rounded-full border border-black/10 px-4 py-2 font-medium text-black dark:border-white/10 dark:text-white",
          currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:border-black/30 dark:hover:border-white/30",
        ].join(" ")}
      >
        Siguiente →
      </Link>
    </div>
  );
}
