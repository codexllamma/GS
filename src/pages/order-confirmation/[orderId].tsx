"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Order, OrderItem, Product, Address } from "@/generated/prisma";
import { useCartStore } from "@/store/useCartStore";

type OrderWithItems = Order & {
  orderItems: (OrderItem & {
    product: Product & { images: { url: string }[] };
  })[];
  address?: Address;
};

const OrderConfirmationPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  // Cart Store Actions for Post-Checkout State Reset
  const clearPurchasedItems = useCartStore((state) => state.clearPurchasedItems);
  const toggleSelectAll = useCartStore((state) => state.toggleSelectAll);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Post-Checkout Cart Reset Logic
  useEffect(() => {
    if (order?.orderItems && order.orderItems.length > 0) {
      const purchasedVariantIds = order.orderItems.map((item) => item.variantId);

      // 1. Remove paid items from the persistent cart store
      clearPurchasedItems(purchasedVariantIds);

      // 2. Re-select any unselected items remaining in the cart
      toggleSelectAll(true);
    }
  }, [order, clearPurchasedItems, toggleSelectAll]);

  // Analytics Tracking: Purchase Event
  useEffect(() => {
    if (!order || !order.orderItems || order.orderItems.length === 0) return;

    // Meta Pixel: Purchase
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        content_ids: order.orderItems.map((item) => item.productId || item.variantId),
        content_type: "product",
        value: order.total,
        currency: "INR",
        num_items: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    // GA4: purchase
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "purchase", {
        transaction_id: order.id,
        value: order.total,
        currency: "INR",
        items: order.orderItems.map((item) => ({
          item_id: item.productId || item.variantId,
          item_name: item.product?.name,
          price: item.priceAtPurchase,
          quantity: item.quantity,
        })),
      });
    }
  }, [order]);

  if (loading)
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-3 text-brand-textSec">
        <div className="w-8 h-8 border-2 border-brand-border border-t-brand-olive rounded-full animate-spin" />
        <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-charcoal">
          Retrieving your order...
        </p>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center text-center px-4">
        <p className="font-serif text-lg text-brand-charcoal uppercase tracking-wider">
          Order Not Found
        </p>
        <p className="text-xs text-brand-textSec mt-1 mb-6">
          We couldn&apos;t locate the details for this transaction.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-brand-btn text-white text-[11px] font-semibold tracking-widest uppercase rounded-sm hover:opacity-90 transition"
        >
          Return Home
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-brand-bg py-10 md:py-16 px-4 sm:px-6 md:px-10 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="bg-brand-card border border-brand-border rounded-sm shadow-sm p-6 sm:p-10 w-full max-w-3xl"
      >
        {/* Header Confirmation Banner */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-stone/50 border border-brand-border flex items-center justify-center mb-3.5">
            <CheckCircle2 size={28} className="text-brand-olive stroke-[1.8]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide uppercase text-brand-charcoal">
            Order Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-brand-textSec mt-1.5 max-w-md font-light leading-relaxed">
            Thank you for choosing HIÈR. Your order has been placed and is being prepared with care.
          </p>
        </div>

        {/* Order Summary Grid */}
        <div className="space-y-3.5 border-t border-brand-border pt-6">
          <h2 className="font-serif text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-charcoal">
            Order Summary
          </h2>
          <div className="grid grid-cols-2 gap-y-2.5 text-xs text-brand-charcoal bg-brand-stone/30 border border-brand-border p-4 rounded-sm">
            <p className="text-brand-textSec uppercase tracking-wider text-[11px]">Order ID</p>
            <p className="font-mono text-xs text-right sm:text-left truncate">{order.id}</p>

            <p className="text-brand-textSec uppercase tracking-wider text-[11px]">Status</p>
            <p className="font-medium capitalize text-right sm:text-left text-brand-olive">
              {order.status.toLowerCase()}
            </p>

            <p className="text-brand-textSec uppercase tracking-wider text-[11px]">Payment Method</p>
            <p className="text-right sm:text-left">{order.paymentMethod || "Prepaid (Razorpay)"}</p>

            <p className="text-brand-textSec uppercase tracking-wider text-[11px] pt-2 border-t border-brand-border/60">
              Total Amount
            </p>
            <p className="font-semibold text-sm text-right sm:text-left pt-2 border-t border-brand-border/60">
              ₹{order.total.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Shipping Address */}
        {order.address && (
          <div className="mt-6 border-t border-brand-border pt-6">
            <h2 className="font-serif text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-charcoal mb-2.5">
              Shipping Address
            </h2>
            <div className="text-xs text-brand-textSec leading-relaxed bg-brand-stone/30 border border-brand-border p-4 rounded-sm font-light">
              <p className="text-brand-charcoal font-medium">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}
              </p>
              <p>
                {order.address.city}, {order.address.state} - {order.address.postal}
              </p>
              <p>{order.address.country}</p>
            </div>
          </div>
        )}

        {/* Purchased Items List */}
        <div className="mt-6 border-t border-brand-border pt-6">
          <h2 className="font-serif text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-charcoal mb-3">
            Items in Your Order ({order.orderItems.length})
          </h2>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-brand-stone/20 border border-brand-border rounded-sm p-3.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={item.product?.images?.[0]?.url || "/placeholder.png"}
                    alt={item.product?.name || "Product"}
                    className="w-14 h-16 rounded-sm object-cover object-top border border-brand-border bg-white flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-xs sm:text-sm font-medium text-brand-charcoal truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-[11px] text-brand-textSec mt-0.5">
                      Qty: {item.quantity} · ₹{item.priceAtPurchase.toLocaleString("en-IN")} each
                    </p>
                  </div>
                </div>
                <p className="font-medium text-xs sm:text-sm text-brand-charcoal flex-shrink-0 ml-3">
                  ₹{(item.quantity * item.priceAtPurchase).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-brand-btn text-white text-[11px] font-semibold tracking-widest uppercase px-8 py-3.5 rounded-sm hover:opacity-90 active:scale-[0.99] transition shadow-sm"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;