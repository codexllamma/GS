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
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end font-apercu">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full bg-white shadow-2xl flex flex-col h-[78vh] sm:h-full sm:max-w-md rounded-t-3xl sm:rounded-none overflow-hidden"
          >
            {/* Header with Back to Bag */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <button
                onClick={onBackToCart}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back to Bag</span>
              </button>

              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-gray-800" />
                <h2 className="text-base font-bold text-gray-900">
                  Summary ({totalItemsCount})
                </h2>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-gray-100">
              {selectedItems.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
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
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            onClick={() => handleProductClick(targetProductId)}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-100 bg-gray-50 flex-shrink-0 cursor-pointer hover:opacity-90 transition"
                          />
                        )}
                        <div>
                          <h4
                            onClick={() => handleProductClick(targetProductId)}
                            className="font-medium text-gray-900 text-sm line-clamp-1 cursor-pointer hover:underline"
                          >
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Size:{" "}
                            <span className="font-semibold text-gray-700">
                              {item.size}
                            </span>{" "}
                            · Qty: {item.quantity}
                          </p>
                          <p className="text-xs font-medium text-gray-900 mt-1">
                            ₹{item.price.toLocaleString()} each
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Breakdown & Action */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Shipping & Taxes</span>
                  <span className="text-green-600 font-medium">
                    Calculated at Razorpay
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <CheckoutButton items={selectedItems} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};