import { describe, expect, it } from "vitest";
import { toMetaEvent } from "./meta-events";

const items = [
  { item_id: "variant-1", item_name: "Remera Oversize", price: 4500, quantity: 2 },
  { item_id: "variant-2", item_name: "Buzo", price: 7000, quantity: 1 },
];

describe("toMetaEvent", () => {
  it.each([
    ["view_item", "ViewContent"],
    ["add_to_cart", "AddToCart"],
    ["begin_checkout", "InitiateCheckout"],
    ["purchase", "Purchase"],
  ])("mapea %s a %s", (name, event) => {
    expect(toMetaEvent(name, { currency: "ARS", value: 16000, items })?.event).toBe(event);
  });

  it("arma el payload de ecommerce con los items de GA4", () => {
    const result = toMetaEvent("add_to_cart", {
      currency: "ARS",
      value: 16000,
      items,
    });

    expect(result?.payload).toEqual({
      content_ids: ["variant-1", "variant-2"],
      content_name: "Remera Oversize",
      content_type: "product",
      value: 16000,
      currency: "ARS",
      num_items: 3,
    });
  });

  it("usa transaction_id como eventId en purchase", () => {
    const result = toMetaEvent("purchase", {
      transaction_id: "order-1",
      currency: "ARS",
      value: 16000,
      items,
    });

    expect(result?.eventId).toBe("order-1");
  });

  it("devuelve null para eventos desconocidos", () => {
    expect(toMetaEvent("page_view", {})).toBeNull();
  });
});
