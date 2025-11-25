import { create } from "zustand";
import { CartItem } from "@/types/cart";

/*
-----------------------------------------------------
 GUEST CART LOCAL STORAGE HELPERS
-----------------------------------------------------
*/

const GUEST_KEY = "guest_cart";

const loadGuestCart = (): CartItem[] => {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (cart: CartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
};

/*
-----------------------------------------------------
 ZUSTAND STORE
-----------------------------------------------------
*/

interface CartStore {
  cart: CartItem[];

  
  fetchCart: (isAuth: boolean) => Promise<void>;

  
  addToCart: (variantId: string, quantity?: number, isAuth?: boolean) => Promise<void>;

  
  removeFromCart: (cartItemId: string, isAuth?: boolean) => Promise<void>;

  
  updateQuantity: (cartItemId: string, quantity: number, isAuth?: boolean) => Promise<void>;

  
  updateVariant: (cartItemId: string, variantId: string, isAuth?: boolean) => Promise<void>;

  
  clearCart: (isAuth?: boolean) => void;


  syncGuestToDB: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],

  
  fetchCart: async (isAuth) => {
  

  if (!isAuth) {
    const local = loadGuestCart();
    set({ cart: local });
    return;
  }

  try {
    const res = await fetch("/api/cart");
    if (!res.ok) throw new Error("Failed to fetch cart");

    const data = await res.json();

    const normalized = (data?.items || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      variant: item.variant,
    }));

    set({ cart: normalized });
    saveGuestCart([]);
  } catch (error) {
    console.error(error);
  }
},


  
  addToCart: async (variantId, quantity = 1, isAuth = false) => {
    if (!isAuth) {
      const cur = loadGuestCart();
      const existing = cur.find((c) => c.variant.id === variantId);

      let updated: CartItem[];
      if (existing) {
        updated = cur.map((c) =>
          c.variant.id === variantId ? { ...c, quantity: c.quantity + quantity } : c
        );
      } else {
        updated = [
          ...cur,
          {
            id: crypto.randomUUID(),
            quantity,
            variant: { id: variantId } as any,
          },
        ];
      }

      saveGuestCart(updated);
      set({ cart: updated });
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      await get().fetchCart(true);
    } catch (error) {
      console.error("Add to cart failed:", error);
    }
  },

  /*
  -----------------------------------------------------
  REMOVE ITEM
  -----------------------------------------------------
  */
  removeFromCart: async (cartItemId, isAuth = false) => {
    if (!isAuth) {
      const updated = loadGuestCart().filter((c) => c.id !== cartItemId);
      saveGuestCart(updated);
      set({ cart: updated });
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });

      if (!res.ok) throw new Error("Failed to remove item");

      set((state) => ({
        cart: state.cart.filter((item) => item.id !== cartItemId),
      }));
    } catch (error) {
      console.error("Remove item failed:", error);
    }
  },

  /*
  -----------------------------------------------------
  UPDATE QUANTITY
  -----------------------------------------------------
  */
  updateQuantity: async (cartItemId, quantity, isAuth = false) => {
    if (!isAuth) {
      const updated = loadGuestCart().map((c) =>
        c.id === cartItemId ? { ...c, quantity } : c
      );
      saveGuestCart(updated);
      set({ cart: updated });
      return;
    }

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
          item.id === updatedItem.id ? { ...item, quantity: updatedItem.quantity } : item
        ),
      }));
    } catch (error) {
      console.error("Update quantity failed:", error);
    }
  },

  /*
  -----------------------------------------------------
  UPDATE VARIANT
  -----------------------------------------------------
  */
  updateVariant: async (cartItemId, variantId, isAuth = false) => {
    if (!isAuth) {
      const updated = loadGuestCart().map((c) =>
        c.id === cartItemId ? { ...c, variant: { id: variantId } as any } : c
      );
      saveGuestCart(updated);
      set({ cart: updated });
      return;
    }

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
    } catch (error) {
      console.error("Update variant failed:", error);
    }
  },

  /*
  -----------------------------------------------------
  CLEAR CART
  -----------------------------------------------------
  */
  clearCart: (isAuth = false) => {
    if (!isAuth) saveGuestCart([]);
    set({ cart: [] });
  },

  /*
  -----------------------------------------------------
  SYNC GUEST CART → DB AFTER LOGIN
  -----------------------------------------------------
  */
  syncGuestToDB: async () => {
    const guest = loadGuestCart();
    if (!guest.length) return;

    try {
      await fetch("/api/cart/import-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guest }),
      });

      saveGuestCart([]);
      await get().fetchCart(true);
    } catch (error) {
      console.error("Guest cart sync failed:", error);
    }
  },
}));
