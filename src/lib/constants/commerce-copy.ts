// Copies comerciales oficiales, centralizados para que navbar (barras de
// promo), footer y ficha de producto (acordeones, trust box) no repitan
// texto suelto por componente.

import { normalizeCategory } from "@/lib/categories";

export const PROMO_BAR_TOP =
  "¡Hasta 6 cuotas sin interés con todos los bancos! • Descuento especial abonando por Transferencia";

export const PROMO_BAR_ROTATING = [
  "Exclusivo CBA: ¡Entrega express en 24 hs Hábiles!",
  "Envíos gratis a todo el país",
  "10 días de cambio",
];

export const SHIPPING_RETURNS_COPY =
  "Exclusivo CBA y GBA: ¡Entrega express en 24 hs Hábiles! Entregas a todo el país. Consultá la fecha estimada de entrega al realizar la compra. Podés devolver tu pedido por cualquier motivo, sin cargo, dentro de un plazo de 10 días.";

export const PAYMENT_METHODS_COPY =
  "Aceptamos las siguientes opciones de pago: Tarjetas de Crédito, Tarjetas de Débito, Mercado Pago (dinero en cuenta y cuotas) y Transferencia Bancaria directa con descuento.";

export const TRUST_BOX_ITEMS = [
  "Hasta 6 cuotas sin interés con todos los bancos.",
  "Retiro en tienda gratis (Punto de entrega Villa María).",
];

export const NEWSLETTER_COPY = {
  title: "Registrate para recibir las últimas novedades de Nixon Studio",
  subtitle: "Acceso anticipado a drops exclusivos, ediciones limitadas y beneficios únicos.",
};

// Chequeo tolerante: normaliza el string (trim + lowercase) y reconoce
// singular/plural de las categorias con talle, mas "oversize" como alias de
// compatibilidad para productos viejos que todavia tienen esa categoria
// guardada en la DB.
export function isSizedCategory(category: string): boolean {
  const normalized = category.trim().toLowerCase();
  return ["remera", "remeras", "buzo", "buzos", "oversize"].includes(normalized);
}

export const SIZE_GUIDE_CM: Array<{ size: string; chest: number; length: number }> = [
  { size: "S", chest: 54, length: 72 },
  { size: "M", chest: 57, length: 75 },
  { size: "L", chest: 60, length: 78 },
  { size: "XL", chest: 63, length: 81 },
  { size: "XXL", chest: 66, length: 84 },
];

// Texto por defecto de "Composicion y cuidados" / "Materiales" cuando el
// producto no tiene su propio texto cargado en el admin (ProductForm permite
// sobreescribirlo por producto). Solo las 4 categorias canonicas - los
// productos con category "oversize" (legado) se resuelven via
// normalizeCategory() antes de buscar en este mapa, asi que no necesitan su
// propia entrada duplicada.
export const DEFAULT_MATERIALS_BY_CATEGORY: Record<string, string> = {
  remera:
    "100% Algodón peinado 24/1 de alto gramaje, cuello cerrado de ribb 1x1, estampa serigráfica de alta densidad tacto cero.",
  buzo:
    "100% Algodón peinado 24/1 de alto gramaje, cuello cerrado de ribb 1x1, estampa serigráfica de alta densidad tacto cero.",
  poster:
    "Placa de aluminio reforzado de alta durabilidad (grosor 1.5mm), impresión directa UV con acabado mate anti-reflejo. Resistente al agua, al polvo y listo para colgar.",
  taza: "Cerámica importada premium, acabado brillante de alta definición, capacidad 330ml. Apta para microondas y lavavajillas.",
};

export const DEFAULT_CARE_BY_CATEGORY: Record<string, string> = {
  remera: "Lavar con agua fría del revés, no planchar sobre la estampa.",
  buzo: "Lavar con agua fría del revés, no planchar sobre la estampa.",
  poster: "",
  taza: "",
};

export function getMaterialsCopy(product: { category: string; materials?: string }) {
  return product.materials || DEFAULT_MATERIALS_BY_CATEGORY[normalizeCategory(product.category)] || "";
}

export function getCareCopy(product: { category: string; careInstructions?: string }) {
  return product.careInstructions || DEFAULT_CARE_BY_CATEGORY[normalizeCategory(product.category)] || "";
}
