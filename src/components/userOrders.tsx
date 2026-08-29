"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Calendar,
  CreditCard,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  color?: string;
  fabric?: string | { name: string };
  images: ProductImage[];
}

interface ProductVariant {
  id?: string;
  size: string;
  product?: Product;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase?: number;
  price?: number;
  variant?: ProductVariant;
  product?: Product;
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  trackingUrl?: string | null;
  awbCode?: string | null;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const normalized = status?.toUpperCase() || "CONFIRMED";
    switch (normalized) {
      case "DELIVERED":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-brand-olive/10 text-brand-olive border border-brand-olive/20 rounded-xs">
            Delivered
          </span>
        );
      case "SHIPPED":
      case "IN_TRANSIT":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-brand-charcoal text-white rounded-xs">
            In Transit
          </span>
        );
      case "RETURN_REQUESTED":
      case "RETURN_IN_PROGRESS":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xs">
            Return in Progress
          </span>
        );
      case "CANCELLED":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-xs">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-brand-card text-brand-charcoal border border-brand-border rounded-xs">
            {status || "Confirmed"}
          </span>
        );
    }
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 size={24} className="animate-spin text-brand-charcoal stroke-[1.5]" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-brand-textSec font-medium">
            Loading Orders...
          </span>
        </div>
      </div>
    );
  }

  // 2. EMPTY STATE
  if (!orders.length) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-charcoal font-sans flex flex-col selection:bg-brand-olive selection:text-white py-6 sm:py-10 px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl w-full mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-textSec hover:text-brand-charcoal transition-colors cursor-pointer group mb-6"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Shopping</span>
          </Link>

          <div className="bg-white border border-brand-border rounded-sm p-8 sm:p-14 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-brand-card flex items-center justify-center mx-auto mb-3.5 border border-brand-border">
              <ShoppingBag size={22} className="text-brand-caption stroke-[1.5]" />
            </div>
            <h1 className="font-serif text-lg sm:text-xl font-normal text-brand-charcoal tracking-wide">
              No Orders on Record
            </h1>
            <p className="text-xs text-brand-textSec mt-1.5 max-w-xs mx-auto leading-relaxed mb-6">
              When you purchase timeless staples from our collections, their tracking details and summaries will appear here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-brand-btn text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition active:scale-[0.99] shadow-xs cursor-pointer"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN ORDERS ARCHIVE
  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal font-sans selection:bg-brand-olive selection:text-white py-6 sm:py-10 px-4 sm:px-6 md:px-8">
      <main className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Breadcrumb & Archive Count */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-textSec hover:text-brand-charcoal transition-colors cursor-pointer group"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Shopping</span>
          </Link>

          <span className="text-[10px] sm:text-[11px] text-brand-textSec tracking-wider uppercase font-semibold">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-2">
          <span className="text-[9px] font-bold tracking-[0.25em] text-brand-charcoal uppercase block mb-0.5">
            CLIENT ARCHIVE
          </span>
          <h1 className="font-serif text-xl sm:text-2xl font-normal text-brand-charcoal tracking-wide">
            Your Orders
          </h1>
        </div>

        {/* Orders Stack */}
        <div className="space-y-4 sm:space-y-5">
          {orders.map((order) => {
            const shiprocketTrackingUrl =
              order.trackingUrl ||
              (order.awbCode ? `https://shiprocket.co/tracking/${order.awbCode}` : null);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="bg-white border border-brand-border rounded-sm shadow-xs overflow-hidden"
              >
                {/* Order Meta Header */}
                <div className="p-4 sm:p-5 bg-brand-card/30 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 lg:gap-8">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                        Order Ref
                      </span>
                      <span className="text-xs font-serif font-medium text-brand-charcoal mt-0.5 block">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                        Placed On
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar size={12} className="text-brand-textSec flex-shrink-0" />
                        <span className="text-xs text-brand-charcoal font-medium">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                        Total Amount
                      </span>
                      <span className="text-xs font-semibold text-brand-charcoal mt-0.5 block">
                        ₹{order.total.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                        Payment
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <CreditCard size={12} className="text-brand-textSec flex-shrink-0" />
                        <span className="text-xs text-brand-charcoal capitalize">
                          {order.paymentMethod || "Prepaid"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-center">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="p-4 sm:p-5 divide-y divide-brand-border/60">
                  {order.orderItems?.map((item) => {
                    const product = item.variant?.product || item.product;
                    const fabricName =
                      typeof product?.fabric === "string"
                        ? product.fabric
                        : product?.fabric?.name || "";
                    const image =
                      product?.images?.[0]?.url ||
                      "https://placehold.co/200x260/png?text=Item";

                    return (
                      <div
                        key={item.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5 sm:gap-4"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 sm:w-16 h-18 sm:h-20 bg-brand-stone/30 rounded-sm overflow-hidden flex-shrink-0 border border-brand-border">
                          <img
                            src={image}
                            alt={product?.name || "Garment"}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        {/* Garment Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-xs sm:text-sm font-medium text-brand-charcoal tracking-wide truncate">
                            {product?.name || "Signature Garment"}
                          </h4>
                          <p className="text-[11px] text-brand-textSec mt-0.5">
                            {fabricName ? `${fabricName} · ` : ""}
                            {product?.color || "Standard"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] font-medium text-brand-charcoal">
                            <span>Size: {item.variant?.size || "Standard"}</span>
                            <span className="text-brand-border">|</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Action CTAs */}
                <div className="p-3.5 sm:p-4 bg-brand-bg/40 border-t border-brand-border flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-2.5">
                  {/* Track Shipment CTA */}
                  {shiprocketTrackingUrl ? (
                    <a
                      href={shiprocketTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto h-9 px-4 bg-white border border-brand-border hover:border-brand-charcoal text-brand-charcoal text-[10px] font-semibold uppercase tracking-widest rounded-sm transition active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Truck size={13} className="stroke-[1.6]" />
                      <span>Track Shipment</span>
                      <ExternalLink size={11} className="text-brand-textSec" />
                    </a>
                  ) : (
                    <div className="w-full sm:w-auto h-9 px-3.5 bg-brand-stone/20 text-brand-textSec text-[10px] font-semibold uppercase tracking-widest rounded-sm flex items-center justify-center gap-1.5 select-none">
                      <Clock size={12} />
                      <span>Preparing Dispatch</span>
                    </div>
                  )}

                  {/* View Details CTA */}
                  <Link
                    href={`/orders/${order.id}`}
                    className="w-full sm:w-auto h-9 px-5 bg-brand-btn text-white text-[10px] font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Package size={13} className="stroke-[1.6]" />
                    <span>View Order</span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}