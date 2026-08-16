"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { CheckoutButton } from "@/components/checkoutButton";
import { useRouter } from "next/router";

interface CheckoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  onSelectProduct?: (productId: string) => void;
}

export const CheckoutSummaryModal: React.FC<CheckoutSummaryModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  onSelectProduct,
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const getSelectedItems = useCartStore((state) => state.getSelectedItems);
  const selectedItems = getSelectedItems();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItemsCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const drawerVariants = {
    hidden: isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 },
    visible: { y: 0, x: 0 },
    exit: isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 },
  };

  const handleProductClick = (productId?: string) => {
    if (!productId) return;
    onClose();
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else {
      router.push({ query: { ...router.query, product: productId } }, undefined, { shallow: true });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "linear" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-[opacity]"
          />

          {/* Drawer Panel */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.36,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="relative z-10 w-full bg-brand-bg shadow-2xl flex flex-col h-[82vh] sm:h-full sm:max-w-md rounded-t-2xl sm:rounded-none overflow-hidden border-t sm:border-t-0 sm:border-l border-brand-border transform-gpu will-change-transform"
          >
            {/* Header with Back to Bag */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg">
              <button
                onClick={onBackToCart}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-textSec hover:text-brand-charcoal transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Bag</span>
              </button>

              <div className="flex items-center gap-2">
                <ShoppingBag size={17} className="text-brand-charcoal stroke-[1.8]" />
                <h2 className="font-serif text-sm sm:text-base font-medium tracking-wider uppercase text-brand-charcoal">
                  Summary ({totalItemsCount})
                </h2>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-brand-caption hover:text-brand-charcoal hover:bg-brand-card rounded-full transition-all cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-brand-border/60 overscroll-contain">
              {selectedItems.length === 0 ? (
                <div className="py-12 text-center text-brand-textSec text-xs tracking-wide">
                  No items selected for checkout.
                </div>
              ) : (
                selectedItems.map((item) => {
                  const targetProductId = item.productId;

                  return (
                    <div
                      key={item.variantId}
                      className="flex items-center justify-between pt-4 first:pt-0"
                    >
                      <div className="flex items-center gap-3.5">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            onClick={() => handleProductClick(targetProductId)}
                            className="w-16 h-20 rounded-sm object-cover object-top border border-brand-border bg-brand-card flex-shrink-0 cursor-pointer hover:opacity-95 transition"
                          />
                        )}
                        <div>
                          <h4
                            onClick={() => handleProductClick(targetProductId)}
                            className="font-serif font-medium text-brand-charcoal text-xs sm:text-sm tracking-wide line-clamp-1 cursor-pointer hover:text-brand-olive transition-colors"
                          >
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-brand-textSec mt-0.5">
                            Size:{" "}
                            <span className="font-semibold text-brand-charcoal">
                              {item.size}
                            </span>{" "}
                            · Qty: {item.quantity}
                          </p>
                          <p className="text-[11px] font-medium text-brand-textSec mt-1">
                            ₹{item.price.toLocaleString("en-IN")} each
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-brand-charcoal text-xs sm:text-sm">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Breakdown & Action */}
            <div className="p-5 sm:p-6 bg-brand-card border-t border-brand-border space-y-3.5 flex-shrink-0">
              <div className="space-y-1.5 text-xs text-brand-textSec">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-brand-charcoal">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Shipping & Taxes</span>
                  <span className="text-brand-sage font-medium">
                    Calculated at Razorpay
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-brand-charcoal pt-2 border-t border-brand-border">
                  <span className="uppercase tracking-wider">Total Amount</span>
                  <span className="text-base">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-1">
                <CheckoutButton items={selectedItems} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};