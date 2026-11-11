// Vocabulario de estados de una orden y traducción de los estados de pago de
// Mercado Pago. Funciones puras (sin Prisma ni red) para que las usen el
// checkout, el webhook, la analítica y los tests desde un único lugar.

export const ORDER_STATUSES = [
  "pending",
  "pending_transfer",
  "paid",
  "paid_stock_conflict",
  "cancelled",
  "refunded",
  "expired",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Estados en los que la orden todavía tiene stock y cupón reservados. Es la
// lista que usa el reclamo atómico de `releaseOrderReservation`: sólo una
// orden en uno de estos estados puede liberar su reserva.
export const RELEASABLE_STATUSES = ["pending", "pending_transfer"] as const;

const PAID_STATUSES: readonly string[] = ["paid", "paid_stock_conflict"];

export function isPaidStatus(status: string): boolean {
  return PAID_STATUSES.includes(status);
}

export function isReleasableStatus(status: string): boolean {
  return (RELEASABLE_STATUSES as readonly string[]).includes(status);
}

export type MercadoPagoStatusMapping = {
  status: OrderStatus;
  releasesReservation: boolean;
};

// Traduce el `status` crudo de un pago de Mercado Pago al estado de la orden.
// Devuelve `null` para estados desconocidos: el llamador debe ignorarlos en
// vez de escribir un valor que no pertenece al vocabulario.
//
// `releasesReservation` para `refunded`/`charged_back` significa "aplica la
// liberación si la orden seguía releasable". La guarda de orden pagada vive en
// el webhook (T5): un reembolso de una orden ya pagada sólo cambia el estado y
// no devuelve stock, porque la reserva ya se consumió.
export function mapMercadoPagoStatus(mpStatus: string): MercadoPagoStatusMapping | null {
  switch (mpStatus) {
    case "approved":
      return { status: "paid", releasesReservation: false };
    case "pending":
    case "authorized":
    case "in_process":
    case "in_mediation":
      return { status: "pending", releasesReservation: false };
    case "rejected":
    case "cancelled":
      return { status: "cancelled", releasesReservation: true };
    case "refunded":
    case "charged_back":
      return { status: "refunded", releasesReservation: true };
    default:
      return null;
  }
}
