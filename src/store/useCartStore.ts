import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface LocalCartItem {
  variantId: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  stock: number; // Added stock property
  quantity: number;
  image?: string;
  fabric?: string;
  color?: string;
  selected: boolean;
  variants?: Array<{
    id: string;
    size: string;
    stock: number;
    price?: number;
  }>;
}

interface CartStore {
  cart: LocalCartItem[];
  addToCart: (item: Omit<LocalCartItem, "selected">) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, targetQuantity: number) => void;
  updateVariant: (oldVariantId: string, newVariant: { id: string; size: string; price?: number; stock: number }) => void;
  toggleSelect: (variantId: string) => void;
  toggleSelectAll: (select: boolean) => void;
  clearCart: () => void;
  getSelectedItems: () => LocalCartItem[];
  getSelectedSubtotal: () => number;
  clearPurchasedItems: (purchasedVariantIds: string[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (newItem) => {
        set((state) => {
          const existingIdx = state.cart.findIndex(
            (i) => i.variantId === newItem.variantId
          );

          if (existingIdx > -1) {
            const updated = [...state.cart];
            const currentQty = updated[existingIdx].quantity;
            const maxStock = updated[existingIdx].stock;
            // Cap quantity at max stock
            updated[existingIdx].quantity = Math.min(currentQty + newItem.quantity, maxStock);
            updated[existingIdx].selected = true;
            return { cart: updated };
          }

          // Initial add capped at max stock
          const initialQty = Math.min(newItem.quantity, newItem.stock);
          return {
            cart: [...state.cart, { ...newItem, quantity: initialQty, selected: true }],
          };
        });
      },

      removeFromCart: (variantId) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.variantId !== variantId),
        }));
      },
      
      clearPurchasedItems: (purchasedVariantIds: string[]) =>
      set((state) => ({
        cart: state.cart.filter(
          (item) => !purchasedVariantIds.includes(item.variantId)
        ),
      })),

      updateQuantity: (variantId, targetQuantity) => {
        if (targetQuantity <= 0) {
          get().removeFromCart(variantId);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.variantId !== variantId) return item;
            // Strictly cap requested quantity to available stock
            const cappedQuantity = Math.min(targetQuantity, item.stock);
            return { ...item, quantity: cappedQuantity };
          }),
        }));
      },

      updateVariant: (oldVariantId, newVariant) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.variantId !== oldVariantId) return item;
            const newStock = newVariant.stock;
            return {
              ...item,
              variantId: newVariant.id,
              size: newVariant.size,
              price: newVariant.price ?? item.price,
              stock: newStock,
              quantity: Math.min(item.quantity, newStock), // Re-cap quantity for new variant stock
            };
          }),
        }));
      },

      toggleSelect: (variantId) => {
        set((state) => ({
          cart: state.cart.map((i) =>
            i.variantId === variantId ? { ...i, selected: !i.selected } : i
          ),
        }));
      },

      toggleSelectAll: (select) => {
        set((state) => ({
          cart: state.cart.map((i) => ({ ...i, selected: select })),
        }));
      },

      clearCart: () => set({ cart: [] }),

      getSelectedItems: () => get().cart.filter((i) => i.selected),

      getSelectedSubtotal: () =>
        get()
          .cart.filter((i) => i.selected)
          .reduce((sum, i) => sum + i.quantity * i.price, 0),
    }),
    {
      name: "shopping-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);