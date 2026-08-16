import { beforeEach, describe, expect, it } from "vitest";
import useCartStore, { MAX_QUANTITY_PER_ITEM, sanitizeItems } from "./cart.store";
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

  it("caps the quantity at MAX_QUANTITY_PER_ITEM regardless of stock (la tienda funciona a pedido)", () => {
    useCartStore.getState().addItem(makeItem({ stock: 0 }), 999);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_QUANTITY_PER_ITEM);
  });

  it("keeps different variants as separate line items", () => {
    useCartStore.getState().addItem(makeItem({ variantId: "variant-m" }), 1);
    useCartStore.getState().addItem(makeItem({ variantId: "variant-l" }), 1);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("updateQuantity caps at MAX_QUANTITY_PER_ITEM and removes the item at zero", () => {
    useCartStore.getState().addItem(makeItem({ stock: 0 }), 1);
    useCartStore.getState().updateQuantity("variant-m", 999);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_QUANTITY_PER_ITEM);

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

// Reproduce el crash real reportado: localStorage con items de una version
// vieja del carrito (le falta price) rompia CartSummary con
// "Cannot read properties of undefined (reading 'toLocaleString')" apenas
// se montaba el CartDrawer. sanitizeItems() es lo que usan migrate() y
// onRehydrateStorage en cart.store.ts para que eso ya no pueda pasar.
describe("sanitizeItems", () => {
  it("keeps well-formed items", () => {
    const valid: CartItem[] = [{ ...makeItem(), quantity: 1 }];
    expect(sanitizeItems(valid)).toHaveLength(1);
  });

  it("drops items missing price (el crash real reportado)", () => {
    const corrupted = [{ ...makeItem(), quantity: 1, price: undefined }];
    expect(sanitizeItems(corrupted)).toHaveLength(0);
  });

  it("drops items with the wrong type for a field", () => {
    const corrupted = [{ ...makeItem(), quantity: 1, price: "4500" }];
    expect(sanitizeItems(corrupted)).toHaveLength(0);
  });

  it("drops items with quantity zero or missing", () => {
    expect(sanitizeItems([{ ...makeItem(), quantity: 0 }])).toHaveLength(0);
    expect(sanitizeItems([{ ...makeItem() }])).toHaveLength(0);
  });

  it("keeps valid items and drops corrupted ones from the same array", () => {
    const mixed = [
      { ...makeItem({ variantId: "ok" }), quantity: 1 },
      { ...makeItem({ variantId: "bad" }), quantity: 1, price: undefined },
    ];
    expect(sanitizeItems(mixed).map((i) => i.variantId)).toEqual(["ok"]);
  });

  it("returns an empty array for non-array input (ej. localStorage vacio o corrupto)", () => {
    expect(sanitizeItems(undefined)).toEqual([]);
    expect(sanitizeItems(null)).toEqual([]);
    expect(sanitizeItems("garbage")).toEqual([]);
  });
});
