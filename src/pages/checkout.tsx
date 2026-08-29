import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthModal } from "@/store/useAuthModal";
import toast from "react-hot-toast"; // <-- ADDED: Fixes the crash on handleCheckout

interface LocalCartItem {
  variantId: string;
  quantity: number;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { open: openAuthModal } = useAuthModal();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [pincode, setPincode] = useState(""); // Cleared the hardcoded "110001"
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
        console.error("Failed to load cart", e);
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
    if (!pincode || pincode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
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
        name: "HIÈR",
        description: "Bespoke Menswear",
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
          color: "#1A1C1E", // brand-charcoal
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed.");
      setIsSubmitting(false);
    }
  };

  /* ===============================
     LOADING STATE
     =============================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-textSec text-sm tracking-widest uppercase">
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
     UI (Updated to HIÈR Design System)
     =============================== */
  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-xs tracking-wider uppercase text-brand-textSec mb-8 cursor-pointer hover:text-brand-charcoal transition"
        >
          <ArrowLeft size={14} className="mr-2" /> Back to Shopping
        </button>

        <div className="flex items-center justify-between mb-10 pb-4 border-b border-brand-border">
          <h1 className="text-2xl font-serif tracking-widest uppercase">Checkout</h1>

          {status !== "authenticated" && (
            <button
              onClick={() => openAuthModal()}
              className="text-xs uppercase tracking-wider text-brand-textSec hover:text-brand-charcoal transition"
            >
              Have an account? <span className="underline">Sign in</span>
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-brand-card p-12 text-center rounded-sm border border-brand-border">
            <p className="text-brand-textSec mb-6 text-sm">Your cart is empty.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-brand-btn text-white px-8 py-3 rounded-sm text-xs tracking-widest uppercase hover:bg-brand-charcoal/90 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-10">
            {/* LEFT */}
            <div className="space-y-6">
              <section className="bg-brand-card p-6 rounded-sm border border-brand-border">
                <h2 className="font-serif text-sm tracking-widest uppercase mb-2">Delivery Details</h2>
                <p className="text-xs text-brand-textSec mb-6 leading-relaxed">
                  Enter your PIN code to verify serviceability. Full address details will be collected securely during payment.
                </p>

                <input
                  type="text"
                  placeholder="Enter 6-digit PIN code *"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} // Strips non-numeric chars
                  className="border border-brand-border p-3.5 rounded-sm w-full max-w-xs text-sm focus:outline-none focus:border-brand-charcoal transition-colors bg-brand-bg"
                  maxLength={6}
                />
              </section>

              <section className="bg-brand-card p-6 rounded-sm border border-brand-border">
                <h2 className="font-serif text-sm tracking-widest uppercase mb-2">Express Checkout</h2>
                <p className="text-xs text-brand-textSec mb-6 leading-relaxed">
                  Address collection and payment choices (UPI, Cards, COD) are managed securely by Razorpay Magic Checkout.
                </p>

                <motion.button
                  whileTap={{ scale: 0.99 }}
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                  className="w-full bg-brand-btn text-white py-4 rounded-sm text-xs tracking-widest uppercase disabled:opacity-50 cursor-pointer hover:bg-brand-charcoal/90 transition"
                >
                  {isSubmitting ? "Processing..." : "Proceed to Payment"}
                </motion.button>
              </section>
            </div>

            {/* RIGHT */}
            <aside className="bg-brand-card p-6 rounded-sm border border-brand-border h-fit sticky top-24">
              <h2 className="font-serif text-sm tracking-widest uppercase mb-6 pb-4 border-b border-brand-border">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between text-sm">
                    <span className="text-brand-charcoal">
                      {item.variant?.product?.name || "Product"} <span className="text-brand-textSec text-xs">({item.variant?.size})</span> <span className="text-xs text-brand-textSec mx-1">×</span> {item.quantity}
                    </span>
                    <span className="font-medium">
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
              </div>

              <div className="flex justify-between font-medium text-base pt-4 border-t border-brand-border">
                <span className="font-serif uppercase tracking-widest text-sm">Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}