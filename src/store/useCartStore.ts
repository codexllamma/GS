import { create } from "zustand";
import { CartItem,GuestCartItem } from "@/types/cart";
import { ProductWithRelations } from "@/types/cart";
import toast from "react-hot-toast";


/*
-----------------------------------------------------
 GUEST CART LOCAL STORAGE HELPERS
-----------------------------------------------------
*/

const GUEST_KEY = "guest_cart";

const loadGuestCart = (): GuestCartItem[] => {
  try {

    if (typeof window === "undefined") return [];

    const raw = localStorage.getItem(GUEST_KEY);

    const parsed = raw ? JSON.parse(raw) : [];

    return parsed.filter(
      (item: any) =>
        item &&
        typeof item.variantId === "string" &&
        typeof item.quantity === "number"
    );

  } catch {
    return [];
  }
};

const saveGuestCart = (cart: GuestCartItem[]) => {
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

  // -------------------------
  // GUEST FLOW
  // -------------------------
  if (!isAuth) {

    const guest = loadGuestCart();

    if (!guest.length) {
      set({ cart: [] });
      return;
    }

    try {

      const res = await fetch("/api/cart/hydrate-guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantIds: guest.map((g) => g.variantId),
        }),
      });

      const data = await res.json();

      console.log("HYDRATE RESPONSE:", data);

      const hydrated: CartItem[] = guest
        .map((item) => {

          const variant = data.variants.find(
            (v: any) => v.id === item.variantId
          );

          // variant deleted / stale localStorage
          if (!variant) return null;

          return {
            id: item.variantId,
            quantity: item.quantity,
            variant,
          };
        })
        .filter(Boolean) as CartItem[];

      set({ cart: hydrated });

    } catch (e) {

      console.error("Guest cart hydration failed", e);

      set({ cart: [] });
    }

    return;
  }

  // -------------------------
  // AUTH USER FLOW
  // -------------------------
  try {

    const res = await fetch("/api/cart");

    if (!res.ok) {
      throw new Error("Failed to fetch cart");
    }

    const data = await res.json();

    if (data?.mode === "USER") {

      set({
        cart: data.cart?.items ?? [],
      });

      saveGuestCart([]);

      return;
    }

    set({ cart: [] });

  } catch (error) {

    console.error("Fetch cart failed:", error);

    set({ cart: [] });
  }
},



  
  addToCart: async (variantId, quantity = 1, isAuth = false) => {
    if (!isAuth) {

  const cur = loadGuestCart();

  const existing = cur.find(
    (c) => c.variantId === variantId
  );

  let updated: GuestCartItem[];

  if (existing) {

  const hydratedItem = get().cart.find(
    (item) => item.variant.id === variantId
  );

  if (!hydratedItem) {
    toast.error("Item unavailable");
    return;
  }

  const availableStock =
    hydratedItem.variant.stock;

  const newQuantity =
    existing.quantity + quantity;

  if (newQuantity > availableStock) {

    toast.error(
      `Only ${availableStock} items available`
    );

    return;
  }

  updated = cur.map((c) =>
    c.variantId === variantId
      ? {
          ...c,
          quantity: newQuantity,
        }
      : c
  );

} else {


  const hydratedItem = get().cart.find(
  (item) => item.variant.id === variantId
);

if (
  hydratedItem &&
  quantity > hydratedItem.variant.stock
) {

  toast.error(
    `Only ${hydratedItem.variant.stock} items available`
  );

  return;
}
  updated = [
    ...cur,
    {
      variantId,
      quantity,
    },
  ];
}

  saveGuestCart(updated);

  await get().fetchCart(false);

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

  const updated = loadGuestCart().filter(
    (c) => c.variantId !== cartItemId
  );

  saveGuestCart(updated);

  await get().fetchCart(false);

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
  
  if (!isAuth) {

    const hydratedItem = get().cart.find(
  (item) => item.id === cartItemId
);

if (!hydratedItem) {
  toast.error("Item unavailable");
  return;
}

const availableStock =
  hydratedItem.variant.stock;

if (quantity > availableStock) {

  toast.error(
    `Only ${availableStock} items available`
  );

  return;
}
  const updated = loadGuestCart().map((c) =>
    c.variantId === cartItemId
      ? {
          ...c,
          quantity,
        }
      : c
  );

  saveGuestCart(updated);

  await get().fetchCart(false);

  return;
}

  try {
    const res = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.message || "Failed to update quantity");

      await get().fetchCart(true);

      return;
    }

    set((state) => ({
    cart: state.cart.map((item) =>
      item.id === cartItemId ? data.item : item
    ),
    }));

  } catch (error) {
    console.error("Update quantity failed:", error);

    toast.error("Something went wrong");

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
    c.variantId === cartItemId
      ? {
          ...c,
          variantId,
        }
      : c
  );

  saveGuestCart(updated);

  await get().fetchCart(false);

  return;
}

    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, variantId }),
      });

      if (!res.ok) throw new Error("Failed to update variant");

      const data = await res.json();
      const updatedVariantItem = data.item;

      set((state) => ({
        cart: state.cart.map((item) =>
          item.id === cartItemId ? updatedVariantItem : item
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
