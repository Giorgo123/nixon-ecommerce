export class CouponError extends Error {}

export interface CouponLike {
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

// Solo valida las reglas que no dependen de concurrencia (activo, vencimiento).
// El limite de usos se aplica con un UPDATE condicional atomico en order.ts,
// no aca, para evitar la carrera de dos checkouts leyendo el mismo usedCount
// antes de que ninguno de los dos haya confirmado.
export function assertCouponUsable(coupon: CouponLike, now: Date = new Date()) {
  if (!coupon.active) {
    throw new CouponError(`El cupón "${coupon.code}" ya no está activo`);
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    throw new CouponError(`El cupón "${coupon.code}" ya venció`);
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponError(`El cupón "${coupon.code}" alcanzó el límite de usos`);
  }
}

// Nunca negativo ni mayor al subtotal, sin importar el tipo/valor cargado.
export function computeDiscount(coupon: { type: string; value: number }, subtotal: number): number {
  if (subtotal <= 0) return 0;
  const raw = coupon.type === "percentage" ? subtotal * (coupon.value / 100) : coupon.value;
  return Math.round(Math.min(Math.max(raw, 0), subtotal) * 100) / 100;
}

// Mercado Pago no soporta un item de "descuento" con precio negativo, asi
// que prorrateamos el descuento entre las lineas del carrito: la suma de
// unit_price * quantity que le llega a MP da exactamente
// subtotal - discountAmount. La ultima linea absorbe el resto del redondeo
// para que cierre exacto.
export function allocateDiscountedUnitPrices(
  lines: Array<{ price: number; quantity: number }>,
  discountAmount: number
): number[] {
  if (discountAmount <= 0 || lines.length === 0) {
    return lines.map((line) => line.price);
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;
  let allocated = 0;

  return lines.map((line, index) => {
    const lineTotal = line.price * line.quantity;
    const isLast = index === lines.length - 1;
    const lineDiscount = isLast
      ? Math.round((discountAmount - allocated) * 100) / 100
      : Math.round(lineTotal * discountRatio * 100) / 100;
    allocated += lineDiscount;
    return Math.round(((lineTotal - lineDiscount) / line.quantity) * 100) / 100;
  });
}
