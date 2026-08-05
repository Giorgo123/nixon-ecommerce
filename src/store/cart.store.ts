"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getItemsCount: () => number;
  getTotal: () => number;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.variantId === item.variantId);

          if (existingItem) {
            const cappedQuantity = Math.min(existingItem.quantity + quantity, item.stock);
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: cappedQuantity } : i
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.stock) }],
          };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId
                    ? { ...item, quantity: Math.min(quantity, item.stock) }
                    : item
                ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      clearCart: () => set({ items: [] }),
      getItemsCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      getTotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: "nixon-cart",
    }
  )
);

export default useCartStore;
