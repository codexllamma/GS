import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthModal } from "@/store/useAuthModal";

interface LocalCartItem {
  variantId: string;
  quantity: number;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { open: openAuthModal } = useAuthModal();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [pincode, setPincode] = useState("110001");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ===============================
     LOAD CART (AUTH OR GUEST)
     =============================== */
  useEffect(() => {
    if (status === "loading") return;

    async function loadData() {
      setLoading(true);
      try {
        if (status === "authenticated") {
          // Logged-in: fetch DB cart
          const cartRes = await fetch("/api/cart");
          const cartData = await cartRes.json();
          setCartItems(cartData.cart?.items ?? []);
        } else {
          // Guest: read local storage and hydrate item details
          const localRaw = localStorage.getItem("guest_cart");
          const localItems: LocalCartItem[] = localRaw ? JSON.parse(localRaw) : [];

          if (localItems.length === 0) {
            setCartItems([]);
            setLoading(false);
            return;
          }

          const variantIds = localItems.map((item) => item.variantId);
          const hydrateRes = await fetch("/api/cart/hydrate-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantIds }),
          });

          const hydrateData = await hydrateRes.json();
          const variantsList = hydrateData.variants ?? [];

          // Merge hydrated variant details with local quantities
          const hydratedCart = localItems.map((local) => {
            const variantMatch = variantsList.find(
              (v: any) => v.id === local.variantId
            );
            return {
              id: local.variantId,
              quantity: local.quantity,
              variant: variantMatch,
            };
          });

          setCartItems(hydratedCart);
        }
      } catch (e) {
        console.error("Cart loading error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [status]);

  const loadRazorpay = () =>
    new Promise<void>((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
    
  const handleCheckout = async () => {
    if (!pincode || pincode.trim().length === 0) {
      alert("Please enter a valid PIN code.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload based on auth state
      let payload: any = { pincode };

      if (status !== "authenticated") {
        const localRaw = localStorage.getItem("guest_cart");
        const localItems: LocalCartItem[] = localRaw ? JSON.parse(localRaw) : [];
        payload.guestItems = localItems;
      }

      // 1. Create Checkout Session + Razorpay Order
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to initialize checkout.");
      }

      // 2. Load SDK & Trigger Magic Checkout Modal
      await loadRazorpay();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Your Store Name",
        description: "Order Checkout",
        order_id: data.razorpayOrder.id,

        handler: async () => {
          // Clear guest cart from localStorage on success
          if (status !== "authenticated") {
            localStorage.removeItem("guest_cart");
          }

          // Redirect to order confirmation (Webhook handles order fulfillment)
          router.push(`/order-confirmation?session_id=${data.checkoutSessionId}`);
        },

        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },

        prefill: session?.user
          ? {
              name: session.user.name || "",
              email: session.user.email || "",
            }
          : undefined,

        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Checkout failed:", err);
      alert(err?.message || "Checkout failed.");
      setIsSubmitting(false);
    }
  };

  /* ===============================
     LOADING STATE
     =============================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500">
        Loading checkout…
      </div>
    );
  }

  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (item.variant?.price ??
          item.variant?.product?.basePrice ??
          0),
    0
  );

  /* ===============================
     UI
     =============================== */
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-sm text-neutral-600 mb-6 cursor-pointer hover:text-black transition"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Shopping
        </button>

        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-light">Checkout</h1>

          {status !== "authenticated" && (
            <button
              onClick={() => openAuthModal()}
              className="text-sm text-neutral-600 underline hover:text-black"
            >
              Have an account? Sign in
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border">
            <p className="text-neutral-500 mb-4">Your cart is empty.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-black text-white px-6 py-2 rounded text-sm"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-10">
            {/* LEFT */}
            <div className="space-y-8">
              <section className="bg-white p-6 rounded-xl border">
                <h2 className="text-lg font-medium mb-2">Delivery PIN Code</h2>
                <p className="text-xs text-neutral-500 mb-4">
                  Enter your PIN code to verify serviceability. Address details will be collected during payment.
                </p>

                <input
                  type="text"
                  placeholder="Enter 6-digit PIN code *"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="border p-3 rounded w-full max-w-xs"
                  maxLength={6}
                />
              </section>

              <section className="bg-white p-6 rounded-xl border">
                <h2 className="text-lg font-medium mb-2">Express Checkout</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Address collection and payment choices (UPI, Cards, COD) are managed securely by Razorpay Magic Checkout.
                </p>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-3.5 rounded font-medium disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Processing..." : "Proceed to Magic Checkout"}
                </motion.button>
              </section>
            </div>

            {/* RIGHT */}
            <aside className="bg-white p-6 rounded-xl border h-fit">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>

              {cartItems.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between mb-3 text-sm">
                  <span>
                    {item.variant?.product?.name || "Product"} ({item.variant?.size}) × {item.quantity}
                  </span>
                  <span>
                    ₹
                    {(
                      item.quantity *
                      (item.variant?.price ??
                        item.variant?.product?.basePrice ??
                        0)
                    ).toLocaleString()}
                  </span>
                </div>
              ))}

              <hr className="my-4" />

              <div className="flex justify-between font-medium text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}