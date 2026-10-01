import type { Product } from "@/features/products/types";
import { catalogFilterLabels, normalizeCategory } from "@/lib/categories";

// Sugerencias del buscador del navbar. Es un ranking puramente local sobre el
// catalogo que ya se trae del server (`getCatalogProducts`), sin indice
// externo ni servicio de busqueda: los campos disponibles son los del propio
// producto (nombre, categoria, descripcion, materiales, SEO, colores y
// talles) y no hay nada mas queomicentar.
export const SEARCH_SUGGESTION_LIMIT = 6;

// Con 1 caracter las sugerencias son ruido ("c" trae medio catalogo), asi que
// recien se consulta a partir del 2do.
export const SEARCH_SUGGESTION_MIN_LENGTH = 2;

export interface ProductSuggestion {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  image: string;
}

// Descompone a NFD y saca los diacriticos, para que "edicion" encuentre
// "Edicion" y "berserk"/"Berserk" se comporten igual. NFD tambien separa la
// enye en "n" + tilde combinante, asi que al borrarla queda "n".
const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type FieldKind = "name" | "category" | "slug" | "description" | "tags" | "meta";

interface SearchField {
  kind: FieldKind;
  weight: number;
  value: string;
}

function productFields(product: Product): SearchField[] {
  const category = normalizeCategory(product.category);

  return [
    // El nombre manda: un token que aparece ahi vale mas que la misma palabra
    // en cualquier otro campo.
    { kind: "name", weight: 100, value: product.name },
    { kind: "category", weight: 60, value: catalogFilterLabels[category] ?? category },
    // El slug ya esta normalizado a minusculas y sin acentos, pero se
    // "desguionatea" para que buscar "droop 45" tambien lo encuentre.
    { kind: "slug", weight: 40, value: product.slug.replace(/-/g, " ") },
    { kind: "description", weight: 30, value: product.description },
    { kind: "tags", weight: 25, value: product.variants.map((variant) => variant.color ?? "").join(" ") },
    { kind: "meta", weight: 18, value: product.seo ?? "" },
    { kind: "tags", weight: 15, value: product.variants.map((variant) => variant.size ?? "").join(" ") },
    { kind: "meta", weight: 12, value: product.materials ?? "" },
    { kind: "meta", weight: 8, value: product.careInstructions ?? "" },
  ];
}

function isWordStart(value: string, index: number): boolean {
  return index === 0 || value[index - 1] === " ";
}

// Puntaje de un producto para una consulta. 0 significa "no coincide".
// Exige que TODOS los tokens de la consulta aparezcan en algun campo (AND):
// si no, "droop 45" devolveria cualquier producto con "#45" o con "droop".
export function scoreProduct(product: Product, rawQuery: string): number {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 0;

  const tokens = query.split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;

  const fields = productFields(product).map((field) => ({
    ...field,
    normalized: normalizeSearchText(field.value),
  }));

  let total = 0;

  for (const token of tokens) {
    let best = 0;
    let matchedAtNameStart = false;
    let matchedAtNameWord = false;

    for (const field of fields) {
      if (!field.normalized) continue;

      const index = field.normalized.indexOf(token);
      if (index === -1) continue;

      let score = field.weight;
      if (field.kind === "name") {
        if (index === 0) {
          score += 60;
          matchedAtNameStart = true;
        } else if (isWordStart(field.normalized, index)) {
          score += 25;
          matchedAtNameWord = true;
        }
      }

      if (score > best) best = score;
    }

    if (best === 0) return 0;

    total += best;
    if (matchedAtNameStart) total += 15;
    else if (matchedAtNameWord) total += 10;
  }

  // Solo desempate: los destacados suben apenas para que, a igual relevancia,
  // aparezcan primero.
  if (product.isFeatured) total += 8;

  return total;
}

export function hasSearchableQuery(rawQuery: string): boolean {
  return normalizeSearchText(rawQuery).length >= SEARCH_SUGGESTION_MIN_LENGTH;
}

export function rankProductSuggestions(
  products: Product[],
  rawQuery: string,
  limit: number = SEARCH_SUGGESTION_LIMIT
): ProductSuggestion[] {
  return products
    .map((product) => ({ product, score: scoreProduct(product, rawQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "es"))
    .slice(0, limit)
    .map(({ product }) => {
      const category = normalizeCategory(product.category);
      return {
        slug: product.slug,
        name: product.name,
        category,
        categoryLabel: catalogFilterLabels[category] ?? category,
        price: product.price,
        image: product.image,
      };
    });
}
