// Categorias canonicas y definitivas del catalogo. "oversize" existio como
// categoria separada historicamente, pero es la misma prenda que "remera"
// (todas las remeras de Nixon Studio son oversize) - dejo de ofrecerse para
// productos nuevos. Los productos viejos que todavia tienen category
// "oversize" guardado en la DB se normalizan en tiempo de lectura via
// normalizeCategory(), no se migra la base a la fuerza.
export const productCategories = ["remera", "buzo", "taza", "poster"] as const;

// Nombre publico completo, usado en la ficha de producto, la tabla del admin
// y en cualquier lugar donde se muestra la categoria de un producto puntual.
export const catalogCategoryLabels: Record<string, string> = {
  all: "Todas",
  remera: "Remeras Oversize",
  oversize: "Remeras Oversize", // legado: mismo label que remera, no se ofrece mas como opcion nueva
  buzo: "Buzos",
  taza: "Tazas personalizadas",
  poster: "Posters de aluminio",
};

// Etiquetas cortas para los chips de filtro del catalogo (sidebar/navbar) -
// mismo set de categorias, texto mas breve para que entren comodo en un chip.
export const catalogFilterLabels: Record<string, string> = {
  all: "Todas",
  remera: "Remeras Oversize",
  buzo: "Buzos",
  taza: "Tazas",
  poster: "Posters",
};

// "oversize" -> "remera" (misma prenda, categoria vieja duplicada). El resto
// de las categorias pasan sin cambios, solo normalizadas a minuscula/trim
// para que comparaciones no fallen por espacios o mayusculas sueltas.
export function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase();
  return normalized === "oversize" ? "remera" : normalized;
}

// Slug estable por categoria canonica para la URL indexable /categoria/[slug].
// El prefijo /categoria/ desacopla estas paginas del /products?category= que
// ya usan navbar y filtros (que siguen funcionando como deep-link), asi no
// colisionan. Los slugs se reservan para las 4 categorias canonicas aunque
// hoy solo "remera" tenga productos: la pagina solo se genera para categorias
// con al menos un producto activo (ver src/app/categoria/[slug]/page.tsx).
export const categorySlugs: Record<string, string> = {
  remera: "remeras-oversize",
  buzo: "buzos",
  taza: "tazas-personalizadas",
  poster: "posters-aluminio",
};

const slugToCategory = new Map(
  Object.entries(categorySlugs).map(([category, slug]) => [slug, category])
);

// Resuelve un slug de URL a la categoria canonica. Devuelve null si el slug no
// corresponde a ninguna categoria conocida (la pagina responde 404). Tambien
// acepta el slug heredado de la categoria "oversize" via normalizeCategory,
// de modo que /categoria/remeras-oversize siempre cae en "remera".
export function categoryFromSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return slugToCategory.get(normalized) ?? null;
}

export function slugForCategory(category: string): string | null {
  return categorySlugs[normalizeCategory(category)] ?? null;
}
