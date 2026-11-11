import { describe, expect, it } from "vitest";
import {
  isPaidStatus,
  isReleasableStatus,
  mapMercadoPagoStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/order-status";

describe("mapMercadoPagoStatus", () => {
  it.each([
    ["approved", "paid", false],
    ["pending", "pending", false],
    ["authorized", "pending", false],
    ["in_process", "pending", false],
    ["in_mediation", "pending", false],
    ["rejected", "cancelled", true],
    ["cancelled", "cancelled", true],
    ["refunded", "refunded", true],
    ["charged_back", "refunded", true],
  ] as const)(
    "mapea %s a %s (releasesReservation=%s)",
    (mpStatus, status, releasesReservation) => {
      expect(mapMercadoPagoStatus(mpStatus)).toEqual({ status, releasesReservation });
    }
  );

  it.each(["unknown", "", "PAID", "in_dispute"])(
    "devuelve null para el estado desconocido %j",
    (mpStatus) => {
      expect(mapMercadoPagoStatus(mpStatus)).toBeNull();
    }
  );

  it("sólo devuelve estados del vocabulario de la orden", () => {
    const vocabulary = new Set<OrderStatus>(ORDER_STATUSES);
    for (const mpStatus of ["approved", "pending", "rejected", "refunded"]) {
      const mapped = mapMercadoPagoStatus(mpStatus);
      if (!mapped) throw new Error(`Se esperaba un mapeo para ${mpStatus}`);
      expect(vocabulary.has(mapped.status)).toBe(true);
    }
  });
});

describe("isPaidStatus", () => {
  it.each([
    ["paid", true],
    ["paid_stock_conflict", true],
    ["pending", false],
    ["pending_transfer", false],
    ["cancelled", false],
    ["refunded", false],
    ["expired", false],
    ["otro", false],
  ] as const)("%s → %s", (status, expected) => {
    expect(isPaidStatus(status)).toBe(expected);
  });
});

describe("isReleasableStatus", () => {
  it.each([
    ["pending", true],
    ["pending_transfer", true],
    ["paid", false],
    ["paid_stock_conflict", false],
    ["cancelled", false],
    ["refunded", false],
    ["expired", false],
    ["otro", false],
  ] as const)("%s → %s", (status, expected) => {
    expect(isReleasableStatus(status)).toBe(expected);
  });
});
