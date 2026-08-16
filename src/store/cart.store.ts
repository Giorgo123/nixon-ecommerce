"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";

// Tope de sanidad por linea de carrito. Ya no se limita por stock real: la
// tienda funciona a pedido (el cliente puede pedir un talle aunque figure
// sin stock cargado, y se coordina el envio/entrega manualmente), asi que
// el stock del variant dejo de ser un techo valido para la cantidad.
export const MAX_QUANTITY_PER_ITEM = 10;

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getItemsCount: () => number;
  getTotal: () => number;
}

// El carrito se persiste en localStorage del navegador de cada cliente, que
// puede tener datos de una version vieja del sitio (un campo que ya no
// existe, renombrado, etc.). Sin esta validacion, un item corrupto ahi
// rompe toda la app apenas se monta el CartDrawer (ver el crash real de
// item.price undefined). Cualquier item que no cumpla la forma actual se
// descarta en silencio en vez de tirar el carrito entero abajo.
export function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.variantId === "string" &&
    typeof i.productId === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    typeof i.image === "string" &&
    typeof i.price === "number" &&
    Number.isFinite(i.price) &&
    typeof i.category === "string" &&
    (i.size === null || typeof i.size === "string") &&
    (i.color === null || typeof i.color === "string") &&
    typeof i.stock === "number" &&
    typeof i.quantity === "number" &&
    i.quantity > 0
  );
}

export function sanitizeItems(items: unknown): CartItem[] {
  return Array.isArray(items) ? items.filter(isValidCartItem) : [];
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.variantId === item.variantId);

          if (existingItem) {
            const cappedQuantity = Math.min(existingItem.quantity + quantity, MAX_QUANTITY_PER_ITEM);
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: cappedQuantity } : i
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }],
          };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId
                    ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
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
      version: 1,
      partialize: (state) => ({ items: state.items }),
      // Se corre siempre que la version guardada no coincide (incluye
      // localStorage viejo sin version, que Zustand trata como version 0).
      migrate: (persistedState) => {
        const state = persistedState as { items?: unknown } | undefined;
        return { items: sanitizeItems(state?.items) };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Doble chequeo aunque la version ya coincida, por si el
          // localStorage fue tocado a mano o quedo en un estado raro. Se usa
          // setState (no mutar "state" directo) para que React se entere del
          // cambio - mutar el objeto que entrega este callback no dispara
          // una re-renderizacion.
          useCartStore.setState({ items: sanitizeItems(state.items) });
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export default useCartStore;
