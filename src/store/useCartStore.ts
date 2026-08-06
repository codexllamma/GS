import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface LocalCartItem {
  variantId: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  stock: number;
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
  buyNow: (item: Omit<LocalCartItem, "selected">) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, targetQuantity: number) => void;
  updateVariant: (
    oldVariantId: string,
    newVariant: { id: string; size: string; price?: number; stock: number }
  ) => void;
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

      // Standard Add to Cart: Keeps existing items selected, increments quantity
      addToCart: (newItem) => {
        set((state) => {
          const existingIdx = state.cart.findIndex(
            (i) => i.variantId === newItem.variantId
          );

          if (existingIdx > -1) {
            const updated = [...state.cart];
            const currentQty = updated[existingIdx].quantity;
            const maxStock = updated[existingIdx].stock;
            updated[existingIdx].quantity = Math.min(
              currentQty + newItem.quantity,
              maxStock
            );
            updated[existingIdx].selected = true;
            return { cart: updated };
          }

          const initialQty = Math.min(newItem.quantity, newItem.stock);
          return {
            cart: [
              ...state.cart,
              { ...newItem, quantity: initialQty, selected: true },
            ],
          };
        });
      },

      // Buy Now: Deselects all existing cart items, selects ONLY this item
      buyNow: (newItem) => {
        set((state) => {
          // 1. Uncheck every item currently in the cart
          const deselectedCart = state.cart.map((item) => ({
            ...item,
            selected: false,
          }));

          // 2. Check if the variant is already present
          const existingIndex = deselectedCart.findIndex(
            (item) => item.variantId === newItem.variantId
          );

          if (existingIndex > -1) {
            const updated = [...deselectedCart];
            const maxStock = updated[existingIndex].stock;
            // Ensure at least requested quantity is available and selected
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: Math.min(
                Math.max(updated[existingIndex].quantity, newItem.quantity),
                maxStock
              ),
              selected: true,
            };
            return { cart: updated };
          }

          // 3. Append as the single active/selected item
          const initialQty = Math.min(newItem.quantity, newItem.stock);
          return {
            cart: [
              ...deselectedCart,
              {
                ...newItem,
                quantity: initialQty,
                selected: true,
              },
            ],
          };
        });
      },

      removeFromCart: (variantId) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.variantId !== variantId),
        }));
      },

      clearPurchasedItems: (purchasedVariantIds: string[]) => {
        set((state) => ({
          cart: state.cart.filter(
            (item) => !purchasedVariantIds.includes(item.variantId)
          ),
        }));
      },

      updateQuantity: (variantId, targetQuantity) => {
        if (targetQuantity <= 0) {
          get().removeFromCart(variantId);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.variantId !== variantId) return item;
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
              quantity: Math.min(item.quantity, newStock),
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