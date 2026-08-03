"use client";

import React, { useState } from "react";
import { LocalCartItem, useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

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
  const clearCart = useCartStore((state) => state.clearCart);
  const { data: session } = useSession();

  // Helper to dynamically load the Razorpay SDK script
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

    try {
      // 1. Ensure Razorpay Script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }

      // 2. Create Checkout Session + Razorpay Order
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
        // Stock Auto-Correction Fallback
        if (data.variantId && typeof data.actualStock === "number") {
          updateQuantity(data.variantId, data.actualStock);
          toast.error(
            `Quantity updated to max available stock (${data.actualStock}).`
          );
          return;
        }

        throw new Error(data.message || "Failed to create checkout session");
      }

      // 3. Dynamically construct prefill object (Omitting empty contact field)
      const prefill: Record<string, string> = {};
      if (session?.user?.name) prefill.name = session.user.name;
      if (session?.user?.email) prefill.email = session.user.email;

      // 4. Open Razorpay Magic Checkout Modal
      const options = {
        key: data.keyId,
        order_id: data.razorpayOrderId,
        name: "HIÈR™",
        one_click_checkout: true,
        show_coupons: true,
        description: "Order Checkout",
        prefill,
        handler: function (response: any) {
          console.log("Payment successful:", response);
          toast.success("Payment Successful! Processing order...");
          clearCart();
          window.location.href = `/order/success?order_id=${response.razorpay_order_id}&payment_id=${response.razorpay_payment_id}`;
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
      className="w-full bg-black text-white font-medium py-3 sm:py-3.5 rounded-md hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all cursor-pointer"
    >
      {loading ? "Opening Checkout..." : "Proceed to Checkout"}
    </button>
  );
};