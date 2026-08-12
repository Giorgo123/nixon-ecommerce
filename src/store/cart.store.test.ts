import { beforeEach, describe, expect, it } from "vitest";
import useCartStore from "./cart.store";
import type { CartItem } from "@/types/cart";

function makeItem(overrides: Partial<Omit<CartItem, "quantity">> = {}) {
  return {
    variantId: "variant-m",
    productId: "product-1",
    slug: "remera",
    name: "Remera",
    image: "/remera.jpg",
    price: 4500,
    category: "oversize",
    size: "M",
    color: null,
    stock: 4,
    ...overrides,
  };
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cart.store", () => {
  it("adds a new item with the requested quantity", () => {
    useCartStore.getState().addItem(makeItem(), 1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("merges quantities when adding the same variant twice", () => {
    useCartStore.getState().addItem(makeItem(), 1);
    useCartStore.getState().addItem(makeItem(), 2);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("caps the quantity at the variant's stock", () => {
    useCartStore.getState().addItem(makeItem({ stock: 4 }), 10);
    expect(useCartStore.getState().items[0].quantity).toBe(4);
  });

  it("keeps different variants as separate line items", () => {
    useCartStore.getState().addItem(makeItem({ variantId: "variant-m" }), 1);
    useCartStore.getState().addItem(makeItem({ variantId: "variant-l" }), 1);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("updateQuantity caps at stock and removes the item at zero", () => {
    useCartStore.getState().addItem(makeItem({ stock: 4 }), 1);
    useCartStore.getState().updateQuantity("variant-m", 10);
    expect(useCartStore.getState().items[0].quantity).toBe(4);

    useCartStore.getState().updateQuantity("variant-m", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removeItem removes only the matching variant", () => {
    useCartStore.getState().addItem(makeItem({ variantId: "variant-m" }), 1);
    useCartStore.getState().addItem(makeItem({ variantId: "variant-l" }), 1);
    useCartStore.getState().removeItem("variant-m");
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(["variant-l"]);
  });

  it("clearCart empties the cart", () => {
    useCartStore.getState().addItem(makeItem(), 1);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("getItemsCount sums quantities across items", () => {
    useCartStore.getState().addItem(makeItem({ variantId: "variant-m" }), 2);
    useCartStore.getState().addItem(makeItem({ variantId: "variant-l", stock: 5 }), 3);
    expect(useCartStore.getState().getItemsCount()).toBe(5);
  });

  it("getTotal sums price * quantity across items", () => {
    useCartStore.getState().addItem(makeItem({ variantId: "variant-m", price: 4500 }), 2);
    useCartStore.getState().addItem(makeItem({ variantId: "variant-l", price: 3000, stock: 5 }), 1);
    expect(useCartStore.getState().getTotal()).toBe(4500 * 2 + 3000);
  });
});
