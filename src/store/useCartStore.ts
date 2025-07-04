import { create } from "zustand";
import { Product } from "@/generated/prisma";

type CartItem = {
  id: string; // cartOrderId
  quantity: number;
  product: Product;
};

interface CartStore {
  cart: CartItem[];
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartOrderId: string) => Promise<void>;
  updateQuantity: (cartOrderId: string, quantity: number) => Promise<void>;
  clearCart: () => void; // Optional: Clear local only
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],

  fetchCart: async () => {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const data = await res.json();
      set({ cart: data });
    } else {
      console.error("Failed to fetch cart");
    }
  },

  addToCart: async (productId, quantity = 1) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.ok) {
      const newItem = await res.json();
      await get().fetchCart(); // Refresh state from server
    } else {
      console.error("Failed to add to cart");
    }
  },

  removeFromCart: async (cartOrderId) => {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartOrderId }),
    });
    if (res.ok) {
      set((state) => ({
        cart: state.cart.filter((item) => item.id !== cartOrderId),
      }));
    } else {
      console.error("Failed to remove item");
    }
  },

  updateQuantity: async (cartOrderId, quantity) => {
    const res = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartOrderId, quantity }),
    });
    if (res.ok) {
      const updatedItem = await res.json();
      set((state) => ({
        cart: state.cart.map((item) =>
          item.id === updatedItem.id ? { ...item, quantity: updatedItem.quantity } : item
        ),
      }));
    } else {
      console.error("Failed to update quantity");
    }
  },

  clearCart: () => set({ cart: [] }), // Optional: For UI reset
}));
