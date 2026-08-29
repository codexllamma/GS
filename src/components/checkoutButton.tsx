"use client";

import React, { useState } from "react";
import { LocalCartItem, useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { calculateCartPricing } from "@/lib/pricing";

interface CheckoutButtonProps {
  items: LocalCartItem[];
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({ items }) => {
  const [loading, setLoading] = useState(false);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearPurchasedItems = useCartStore((state) => state.clearPurchasedItems);
  const { data: session } = useSession();

  const pricing = calculateCartPricing(items);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!items || items.length === 0) {
      toast.error("Please select at least one item to checkout");
      return;
    }

    setLoading(true);

    // Analytics Tracking with Discounted Total
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_ids: items.map((i) => i.productId || i.variantId),
        num_items: pricing.totalQuantity,
        value: pricing.finalTotal,
        currency: "INR",
      });
    }

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "begin_checkout", {
        currency: "INR",
        value: pricing.finalTotal,
        items: items.map((i) => ({
          item_id: i.productId || i.variantId,
          item_name: i.name,
          item_variant: i.size,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    }

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }

      // Backend endpoint creates the session using server-validated prices & discount
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.variantId && typeof data.actualStock === "number") {
          updateQuantity(data.variantId, data.actualStock);
          toast.error(`Quantity updated to max available stock (${data.actualStock}).`);
          return;
        }
        throw new Error(data.message || "Failed to create checkout session");
      }

      const prefill: Record<string, string> = {};
      if (session?.user?.name) prefill.name = session.user.name;
      if (session?.user?.email) prefill.email = session.user.email;

      const options = {
        key: data.keyId,
        order_id: data.razorpayOrderId,
        name: "HIÈR™",
        one_click_checkout: true,
        show_coupons: true,
        description: "Order Checkout",
        prefill,
        handler: async function (response: any) {
          const toastId = toast.loading("Verifying payment security...");
          document.body.classList.add("overflow-hidden");

          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                checkoutSessionId: data.sessionId || data.checkoutSessionId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              toast.error(verifyData.message || "Payment verification failed.", { id: toastId });
              return;
            }

            if (Array.isArray(verifyData.purchasedVariantIds)) {
              clearPurchasedItems(verifyData.purchasedVariantIds);
            }

            toast.success("Payment verified successfully!", { id: toastId });
            window.location.href = `/order-confirmation/${verifyData.orderId}`;
          } catch (err: any) {
            console.error("Verification error:", err);
            toast.error("Network error during payment verification.", { id: toastId });
          } finally {
            document.body.classList.remove("overflow-hidden");
          }
        },
        modal: {
          ondismiss: function () {
            toast("Checkout cancelled", { icon: "ℹ️" });
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error("Checkout trigger error:", error);
      toast.error(error.message || "Could not start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || items.length === 0}
      className="w-full bg-brand-btn text-white text-[11px] font-semibold uppercase tracking-widest py-3.5 rounded-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
    >
      {loading ? (
        "Opening Razorpay..."
      ) : (
        <span>Proceed to Payment · ₹{pricing.finalTotal.toLocaleString("en-IN")}</span>
      )}
    </button>
  );
};