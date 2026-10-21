import Link from "next/link";
import { safeJsonLd } from "@/lib/utils";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

// Breadcrumb visible + JSON-LD BreadcrumbList. El ultimo item es la pagina
// actual: no se renderiza como link (aria-current="page"). Recibe la misma
// lista que arma el JSON-LD para que lo visible y lo estructurado nunca se
// contradigan (requisito de Google). Reusa los colores de navegacion del PDP
// (text-nixon-muted -> hover text-nixon-ink) para no introducir un estilo nuevo.
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildBreadcrumbJsonLd(items)) }}
      />
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-nixon-muted">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-x-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-nixon-muted/60">
                    /
                  </span>
                )}
                {isLast ? (
                  <span aria-current="page" className="font-medium text-nixon-ink">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="transition-colors hover:text-nixon-ink"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
