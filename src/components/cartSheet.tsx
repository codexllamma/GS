"use client";

import React, { useEffect, useState } from "react";
import { Plus, Minus, X, CheckSquare, Square, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSummary: () => void;
  onSelectProduct?: (productId: string) => void;
}

const sheetMotion = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: {
    duration: 0.36,
    ease: [0.32, 0.72, 0, 1] as const,
  },
};

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onClose,
  onOpenSummary,
  onSelectProduct,
}) => {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    updateVariant,
    removeFromCart,
    toggleSelect,
    toggleSelectAll,
    getSelectedItems,
    getSelectedSubtotal,
  } = useCartStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const selectedItems = isHydrated ? getSelectedItems() : [];
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = isHydrated ? getSelectedSubtotal() : 0;
  const allSelected = cart.length > 0 && cart.every((item) => item.selected);

  const handleProceedToSummary = () => {
    onClose();
    onOpenSummary();
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
        <>
          {/* Hardware-Accelerated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "linear" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transform-gpu will-change-[opacity]"
          />

          {/* Expanded Width Sheet Container for Desktop (w-[500px] md:w-[540px] max-w-full) */}
          <motion.div
            initial={sheetMotion.initial}
            animate={sheetMotion.animate}
            exit={sheetMotion.exit}
            transition={sheetMotion.transition}
            className="fixed bottom-0 left-0 right-0 h-[82vh] sm:h-full sm:w-[500px] md:w-[540px] sm:max-w-[90vw] sm:left-auto sm:top-0 bg-brand-bg z-50 rounded-t-2xl sm:rounded-none flex flex-col shadow-2xl border-t sm:border-t-0 sm:border-l border-brand-border transform-gpu will-change-transform"
          >
            {/* Header */}
            <div className="flex flex-col items-center pt-3 sm:pt-5 pb-3 sm:pb-4 px-5 sm:px-8 border-b border-brand-border bg-brand-bg flex-shrink-0">
              <div className="w-10 h-1 bg-brand-border rounded-full mb-3 sm:hidden" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag size={20} className="text-brand-charcoal stroke-[1.8]" />
                  <h2 className="font-serif text-base sm:text-lg font-medium tracking-wider uppercase text-brand-charcoal">
                    Your Bag ({cart.length})
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-full text-brand-textSec hover:text-brand-charcoal hover:bg-brand-card transition cursor-pointer"
                  aria-label="Close cart"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Select All Bar */}
              {cart.length > 0 && (
                <div className="w-full flex items-center justify-between mt-3.5 pt-3 border-t border-brand-border/60">
                  <button
                    onClick={() => toggleSelectAll(!allSelected)}
                    className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-charcoal hover:text-brand-olive transition cursor-pointer"
                  >
                    {allSelected ? (
                      <CheckSquare size={16} className="text-brand-olive" />
                    ) : (
                      <Square size={16} className="text-brand-caption" />
                    )}
                    Select All
                  </button>
                  <span className="text-[11px] text-brand-textSec tracking-wide">
                    {selectedCount} items selected
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-5 divide-y divide-brand-border/60 overscroll-contain">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-brand-card flex items-center justify-center mb-3.5 border border-brand-border">
                    <ShoppingBag size={26} className="text-brand-caption stroke-[1.5]" />
                  </div>
                  <p className="font-serif text-lg font-medium text-brand-charcoal">Your bag is empty</p>
                  <p className="text-xs text-brand-textSec mt-1 mb-6 max-w-xs leading-relaxed">
                    Explore our curated collection to add timeless essentials.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-7 py-3 bg-brand-btn text-white text-[11px] font-semibold tracking-widest uppercase rounded-sm hover:opacity-90 transition cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    Start Browsing
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const image = item.image || "https://placehold.co/200x260/png?text=Product";
                  const isEditing = editItemId === item.variantId;
                  const isMaxStock = item.stock !== undefined && item.quantity >= item.stock;
                  const targetProductId = item.productId;

                  return (
                    <div key={item.variantId} className="pt-5 first:pt-0 flex gap-3.5 sm:gap-4">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelect(item.variantId)}
                        className="mt-2 text-brand-charcoal hover:text-brand-olive transition self-start cursor-pointer"
                      >
                        {item.selected ? (
                          <CheckSquare size={18} className="text-brand-olive" />
                        ) : (
                          <Square size={18} className="text-brand-caption" />
                        )}
                      </button>

                      {/* Image Thumbnail */}
                      <div
                        onClick={() => handleProductClick(targetProductId)}
                        className="w-20 sm:w-24 h-26 sm:h-30 bg-brand-card rounded-sm overflow-hidden flex-shrink-0 border border-brand-border cursor-pointer hover:opacity-95 transition"
                      >
                        <img src={image} alt={item.name} className="w-full h-full object-cover object-top" />
                      </div>

                      {/* Details & Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4
                              onClick={() => handleProductClick(targetProductId)}
                              className="font-serif text-sm sm:text-base font-medium text-brand-charcoal tracking-wide truncate cursor-pointer hover:text-brand-olive transition-colors"
                            >
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="text-brand-caption hover:text-brand-charcoal p-1 cursor-pointer transition-colors"
                              aria-label="Remove item"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <p className="text-[11px] sm:text-xs text-brand-textSec mt-0.5">
                            {item.fabric ? `${item.fabric} · ` : ""}
                            {item.color || "Standard"}
                          </p>

                          {/* Size Selection Toggle */}
                          <div className="mt-1.5 flex items-center gap-2">
                            {!isEditing ? (
                              <>
                                <span className="text-[11px] sm:text-xs font-medium text-brand-charcoal">
                                  Size: {item.size}
                                </span>
                                {item.variants && item.variants.length > 0 && (
                                  <button
                                    onClick={() => setEditItemId(item.variantId)}
                                    className="text-[10px] sm:text-[11px] text-brand-textSec underline underline-offset-2 hover:text-brand-charcoal cursor-pointer font-medium"
                                  >
                                    Change
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.variants?.map((v) => (
                                  <button
                                    key={v.id}
                                    disabled={v.stock === 0}
                                    onClick={() => {
                                      updateVariant(item.variantId, {
                                        id: v.id,
                                        size: v.size,
                                        price: v.price,
                                        stock: v.stock,
                                      });
                                      setEditItemId(null);
                                    }}
                                    className={`px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium border rounded-sm cursor-pointer transition-colors ${
                                      v.id === item.variantId
                                        ? "bg-brand-olive text-white border-brand-olive"
                                        : "border-brand-border bg-white text-brand-charcoal hover:border-brand-charcoal"
                                    } ${v.stock === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
                                  >
                                    {v.size}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Quantity Stepper */}
                        <div className="flex items-center justify-between mt-3 pt-1">
                          <span className="text-sm sm:text-base font-semibold text-brand-charcoal">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>

                          <div className="flex items-center border border-brand-border bg-white rounded-sm">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1 px-2 hover:bg-brand-card transition text-brand-charcoal cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2.5 text-[11px] sm:text-xs font-semibold text-brand-charcoal">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={isMaxStock}
                              className={`p-1 px-2 transition ${
                                isMaxStock
                                  ? "opacity-30 cursor-not-allowed text-brand-caption"
                                  : "hover:bg-brand-card text-brand-charcoal cursor-pointer"
                              }`}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Sticky Checkout Footer */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-7 border-t border-brand-border bg-brand-card flex-shrink-0 space-y-3.5">
                <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-brand-charcoal">
                  <span className="uppercase tracking-wider">Subtotal ({selectedCount} items)</span>
                  <span className="font-semibold text-base sm:text-lg">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <button
                  onClick={handleProceedToSummary}
                  disabled={selectedItems.length === 0}
                  className="w-full py-3.5 sm:py-4 bg-brand-btn text-white text-[11px] sm:text-xs font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>

                <p className="text-[10px] sm:text-[11px] text-brand-caption text-center tracking-wide">
                  Complimentary shipping on all prepaid orders
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};