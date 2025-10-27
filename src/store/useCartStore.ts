import { create } from "zustand";
import { Product, ProductVariant } from "@/generated/prisma";
import { CartItem } from "@/types/cart";

// --- Types ---
export interface CartVariant extends ProductVariant {
  product: Product & {
    images: { url: string }[];
  };
}

interface CartStore {
  cart: CartItem[];
  fetchCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  updateVariant: (cartItemId: string, variantId: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],

  
  fetchCart: async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();

      // Normalize backend shape
      const normalized = (data?.items || []).map((it: any) => ({
        id: it.id,
        quantity: it.quantity,
        variant: it.variant,
      }));

      set({ cart: normalized });
    } catch (err) {
      console.error("Fetch cart failed:", err);
    }
  },

  
  addToCart: async (variantId, quantity = 1) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      await get().fetchCart(); // re-fetch latest state
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  },

  // 🧩 REMOVE ITEM
  removeFromCart: async (cartItemId) => {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });

      if (!res.ok) throw new Error("Failed to remove from cart");

      set((state) => ({
        cart: state.cart.filter((item) => item.id !== cartItemId),
      }));
    } catch (err) {
      console.error("Remove from cart failed:", err);
    }
  },

  // 🧩 UPDATE QUANTITY
  updateQuantity: async (cartItemId, quantity) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });

      if (!res.ok) throw new Error("Failed to update quantity");

      const updatedItem = await res.json();

      set((state) => ({
        cart: state.cart.map((item) =>
          item.id === updatedItem.id
            ? { ...item, quantity: updatedItem.quantity }
            : item
        ),
      }));
    } catch (err) {
      console.error("Update quantity failed:", err);
    }
  },

  clearCart: () => set({ cart: [] }),
  
  updateVariant: async (cartItemId, variantId) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, variantId }),
      });

      if (!res.ok) throw new Error("Failed to update variant");

      const updatedItem = await res.json();

      set((state) => ({
        cart: state.cart.map((item) =>
          item.id === cartItemId ? updatedItem : item
        ),
      }));
    } catch (err) {
      console.error("Update variant failed:", err);
    }
  },



}));

