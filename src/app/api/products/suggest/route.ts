import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog";
import { isDatabaseConnectionError } from "@/lib/db-safe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  hasSearchableQuery,
  rankProductSuggestions,
  SEARCH_SUGGESTION_LIMIT,
} from "@/lib/search-suggestions";

// Sugerencias del buscador del navbar. Es la MISMA fuente de datos que usa la
// pagina /products (`getCatalogProducts`), sin indice ni servicio externo: se
// rankea en memoria y se devuelven solo las N mejores. Es dinamica a proposito
// (no cachea) para que un producto recien creado por el admin aparezca al
// instante, igual que el revalidatePath de /api/products.
export const dynamic = "force-dynamic";

// El buscador dispara una consulta por pulsación (con debounce), asi que el
// limite es holgado a proposito: 120/min por IP aguanta a alguien que escribe
// con pausas y frena un barrido automatico del endpoint.
const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (!hasSearchableQuery(query)) {
    return NextResponse.json({ suggestions: [] });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`search-suggest:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Demasiadas consultas" }, { status: 429 });
  }

  try {
    const products = await getCatalogProducts();
    return NextResponse.json(
      { suggestions: rankProductSuggestions(products, query, SEARCH_SUGGESTION_LIMIT) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "No se pudo conectar a la base de datos" }, { status: 503 });
    }
    return NextResponse.json({ error: "Error al buscar sugerencias" }, { status: 500 });
  }
}
