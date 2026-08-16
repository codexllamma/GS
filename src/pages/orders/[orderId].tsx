"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  RotateCcw,
  ExternalLink,
  Loader2,
  Calendar,
  CreditCard,
  MapPin,
  ShieldCheck,
  Mail,
  HelpCircle,
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

interface Address {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal: string;
  country: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal?: number;
  paymentMethod: string;
  paymentStatus?: string;
  trackingUrl?: string | null;
  returnUrl?: string | null;
  awbCode?: string | null;
  courierName?: string | null;
  address?: Address | null;
  createdAt: string;
  deliveredAt?: string | null;
  orderItems: OrderItem[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const isReturnEligible = () => {
    if (!order) return false;
    const baseDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
    const diffHours = (new Date().getTime() - baseDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 72 && order.status.toUpperCase() !== "CANCELLED";
  };

  const getStatusBadge = (status: string) => {
    const normalized = status?.toUpperCase() || "CONFIRMED";
    switch (normalized) {
      case "DELIVERED":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 bg-brand-olive/10 text-brand-olive border border-brand-olive/20 rounded-xs">
            Delivered
          </span>
        );
      case "SHIPPED":
      case "IN_TRANSIT":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 bg-brand-charcoal text-white rounded-xs">
            In Transit
          </span>
        );
      case "RETURN_REQUESTED":
      case "RETURN_IN_PROGRESS":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xs">
            Return in Progress
          </span>
        );
      case "CANCELLED":
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xs">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 bg-brand-card text-brand-charcoal border border-brand-border rounded-xs">
            {status || "Confirmed"}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 size={24} className="animate-spin text-brand-charcoal stroke-[1.5]" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-brand-textSec font-medium">
            Retrieving Order Record...
          </span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-charcoal font-sans flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-white border border-brand-border rounded-sm p-6 sm:p-10 text-center max-w-sm w-full shadow-xs">
          <Package size={26} className="text-brand-caption stroke-[1.5] mx-auto mb-2.5" />
          <h1 className="font-serif text-lg font-medium text-brand-charcoal">Order Record Unavailable</h1>
          <p className="text-xs text-brand-textSec mt-1 leading-relaxed mb-5">
            We were unable to locate this order. It may belong to another client profile or has been archived.
          </p>
          <Link
            href="/orders/orders-page"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-btn text-white text-[11px] font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition active:scale-[0.99]"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const shiprocketTrackingUrl =
    order.trackingUrl ||
    (order.awbCode ? `https://shiprocket.co/tracking/${order.awbCode}` : null);

  const shiprocketReturnUrl =
    order.returnUrl ||
    (order.awbCode
      ? `https://shiprocket.co/tracking/${order.awbCode}?action=return`
      : `mailto:support@hièr.store?subject=${encodeURIComponent(
          `Return Request for Order #${order.id.slice(-8).toUpperCase()}`
        )}`);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal font-sans selection:bg-brand-olive selection:text-white py-4 sm:py-8 px-3.5 sm:px-6 md:px-8">
      <main className="max-w-4xl w-full mx-auto space-y-3.5 sm:space-y-5">
        
        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/orders/orders-page"
            className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-textSec hover:text-brand-charcoal transition-colors cursor-pointer group"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Orders</span>
          </Link>

          <div>{getStatusBadge(order.status)}</div>
        </div>

        {/* Order Header Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="bg-white border border-brand-border rounded-sm p-4 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 border-b border-brand-border gap-3.5">
            <div>
              <span className="text-[9px] font-bold tracking-[0.25em] text-brand-charcoal uppercase block mb-0.5">
                ORDER RECEIPT
              </span>
              <h1 className="font-serif text-lg sm:text-2xl font-normal text-brand-charcoal tracking-wide">
                #{order.id.slice(-8).toUpperCase()}
              </h1>
            </div>

            {/* Mobile-Friendly CTAs */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              {shiprocketTrackingUrl ? (
                <a
                  href={shiprocketTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-9 px-3.5 bg-white border border-brand-border hover:border-brand-charcoal text-brand-charcoal text-[10px] font-semibold uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <Truck size={13} className="stroke-[1.6]" />
                  <span>Track Shipment</span>
                  <ExternalLink size={11} className="text-brand-textSec" />
                </a>
              ) : (
                <div className="w-full sm:w-auto h-9 px-3 bg-brand-stone/20 text-brand-textSec text-[10px] font-semibold uppercase tracking-widest rounded-sm flex items-center justify-center gap-1.5 select-none">
                  <Clock size={12} />
                  <span>To Be Shipped</span>
                </div>
              )}

              {isReturnEligible() ? (
                <a
                  href={shiprocketReturnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-9 px-3.5 bg-brand-card hover:bg-brand-stone/40 border border-brand-border text-brand-charcoal text-[10px] font-semibold uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <RotateCcw size={12} className="stroke-[1.6]" />
                  <span>Request Return</span>
                </a>
              ) : (
                <div
                  title="Returns are eligible within 72 hours of delivery"
                  className="w-full sm:w-auto h-9 px-3 bg-brand-card/40 border border-dashed border-brand-border text-brand-textSec text-[10px] font-semibold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 select-none"
                >
                  <ShieldCheck size={12} className="text-brand-olive" />
                  <span>72hr Window</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-3.5 sm:pt-4">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                Booking Date
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} className="text-brand-textSec flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-medium text-brand-charcoal">
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
                Payment Mode
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CreditCard size={12} className="text-brand-textSec flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-medium text-brand-charcoal capitalize">
                  {order.paymentMethod || "Prepaid"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                Logistics Partner
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-brand-charcoal mt-0.5 block truncate">
                {order.courierName || "Shiprocket Express"}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold block">
                AWB Consignment
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-brand-charcoal mt-0.5 block truncate">
                {order.awbCode || "Generating..."}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Ordered Items Breakdown */}
        <div className="bg-white border border-brand-border rounded-sm p-4 sm:p-6 shadow-xs">
          <h2 className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-brand-charcoal uppercase mb-3">
            Purchased Essentials
          </h2>

          <div className="divide-y divide-brand-border/60">
            {order.orderItems?.map((item) => {
              const product = item.variant?.product || item.product;
              const fabricName =
                typeof product?.fabric === "string"
                  ? product.fabric
                  : product?.fabric?.name || "";
              const image =
                product?.images?.[0]?.url ||
                "https://placehold.co/200x260/png?text=Item";
              const unitPrice = item.priceAtPurchase || item.price || 0;

              return (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start sm:items-center gap-3 sm:gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 sm:w-16 h-18 sm:h-20 bg-brand-stone/30 rounded-sm overflow-hidden flex-shrink-0 border border-brand-border">
                    <img
                      src={image}
                      alt={product?.name || "Garment"}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* Specifications */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-serif text-xs sm:text-sm font-medium text-brand-charcoal tracking-wide truncate">
                      {product?.name || "Signature Garment"}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-brand-textSec mt-0.5 truncate">
                      {fabricName ? `${fabricName} · ` : ""}
                      {product?.color || "Standard"}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] font-medium text-brand-charcoal">
                      <span>Size: {item.variant?.size || "Standard"}</span>
                      <span className="text-brand-border">|</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-brand-charcoal">
                      ₹{(unitPrice * item.quantity).toLocaleString("en-IN")}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[9px] sm:text-[10px] text-brand-textSec block mt-0.5">
                        ₹{unitPrice.toLocaleString("en-IN")} ea
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address & Financial Settlement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Shipping Address Card */}
          <div className="bg-white border border-brand-border rounded-sm p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={13} className="text-brand-textSec stroke-[1.6]" />
                <h3 className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-brand-charcoal uppercase">
                  Delivery Destination
                </h3>
              </div>

              {order.address ? (
                <div className="text-xs text-brand-charcoal leading-relaxed space-y-0.5 font-light">
                  <p className="font-medium">{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p className="text-brand-textSec">
                    {order.address.city}, {order.address.state} {order.address.postal}
                  </p>
                  <p className="text-brand-textSec">{order.address.country}</p>
                </div>
              ) : (
                <p className="text-xs text-brand-textSec italic">Shipping address recorded on file.</p>
              )}
            </div>

            <div className="pt-2.5 mt-3 border-t border-brand-border/60 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-brand-textSec">
              <ShieldCheck size={13} className="text-brand-olive flex-shrink-0" />
              <span>Complimentary insured shipping</span>
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="bg-white border border-brand-border rounded-sm p-4 sm:p-5 shadow-xs space-y-2">
            <h3 className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-brand-charcoal uppercase mb-2">
              Settlement Summary
            </h3>

            <div className="flex justify-between text-xs text-brand-textSec font-light">
              <span>Subtotal</span>
              <span className="text-brand-charcoal font-medium">
                ₹{(order.subtotal || order.total).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-xs text-brand-textSec font-light">
              <span>Shipping & Logistics</span>
              <span className="text-brand-olive font-medium uppercase text-[9px] sm:text-[10px] tracking-wider">
                Complimentary
              </span>
            </div>

            <div className="flex justify-between text-xs text-brand-textSec font-light">
              <span>GST & Taxes (18%)</span>
              <span className="text-brand-charcoal font-medium">Included</span>
            </div>

            <div className="pt-2 border-t border-brand-border flex justify-between items-baseline">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal">
                Total Paid
              </span>
              <span className="font-serif text-base sm:text-lg font-semibold text-brand-charcoal">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Concierge Assistance Footer */}
        <div className="p-4 bg-brand-card/40 border border-brand-border rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-start sm:items-center gap-2.5">
            <HelpCircle size={16} className="text-brand-textSec flex-shrink-0 mt-0.5 sm:mt-0 stroke-[1.6]" />
            <div>
              <p className="text-xs font-medium text-brand-charcoal">Require Assistance with this Order?</p>
              <p className="text-[10px] sm:text-[11px] text-brand-textSec mt-0.5 font-light">
                Our concierge team is available to assist with alterations, fit advice, and exchanges.
              </p>
            </div>
          </div>

          <a
            href={`mailto:support@hièr.store?subject=${encodeURIComponent(
              `Assistance with Order #${order.id.slice(-8).toUpperCase()}`
            )}&body=${encodeURIComponent(
              `Hi HIÈR Concierge,\n\nI need assistance with my Order #${order.id}.\n\nQuery Details:\n`
            )}`}
            className="w-full sm:w-auto h-9 px-4 bg-white border border-brand-border hover:border-brand-charcoal text-brand-charcoal text-[10px] font-semibold uppercase tracking-widest rounded-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <Mail size={12} />
            <span>Contact Concierge</span>
          </a>
        </div>

      </main>
    </div>
  );
}