import { create } from "zustand";
import { CartItem } from "@/types/cart";
import { ProductWithRelations } from "@/types/cart";

const GUEST_PRODUCT: ProductWithRelations = {
  id: "guest",
  name: "Item",
  description: "",
  basePrice: 0,
  color: "",
  fabricId: "",
  fabric: null,
  images: [],
  variants: [],
  sortOrder: 0,
  isDeleted: false,
  createdAt: new Date(),
};

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
  const guest = loadGuestCart();

  if (!guest.length) {
    set({ cart: [] });
    return;
  }

  try {
    const res = await fetch("/api/cart/hydrate-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantIds: guest.map((g) => g.variant.id),
      }),
    });

    const data = await res.json();

    const hydrated = guest.map((item) => {
      const variant = data.variants.find(
        (v: any) => v.id === item.variant.id
      );

      return {
        ...item,
        variant,
      };
    });

    set({ cart: hydrated });
  } catch (e) {
    console.error("Guest cart hydration failed", e);
    set({ cart: [] });
  }

  return;
}




  try {
    
    const res = await fetch("/api/cart");
    if (!res.ok) throw new Error("Failed to fetch cart");

    const data = await res.json();

  
    if (data?.mode === "USER") {
      set({
        cart: data.cart?.items ?? [],
      });
      saveGuestCart([]);
      return;
    }

    // Safety fallback
    set({ cart: [] });
  } catch (error) {
    console.error("Fetch cart failed:", error);
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

  
  updateQuantity: async (cartItemId, quantity, isAuth = false) => {
  
  set((state) => ({
    cart: state.cart.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item
    ),
  }));

  if (!isAuth) {
    const updated = loadGuestCart().map((c) =>
      c.id === cartItemId ? { ...c, quantity } : c
    );
    saveGuestCart(updated);
    return;
  }

  try {
    const res = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });

    if (!res.ok) throw new Error("Failed to update quantity");

    
    await get().fetchCart(true);
  } catch (error) {
    console.error("Update quantity failed:", error);

    
    await get().fetchCart(true);
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
      await fetch("/api/cart/merge-after-login", {
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
