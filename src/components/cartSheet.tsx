"use client";

import React, { useEffect, useState } from "react";
import { Plus, Minus, X, CheckSquare, Square, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { CheckoutButton } from "@/components/checkoutButton";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSheet: React.FC<CartSheetProps> = ({ isOpen, onClose }) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Sheet Container: 78vh on mobile, Full Height Right Drawer on Desktop */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 h-[78vh] sm:h-full sm:max-w-md sm:left-auto sm:top-0 bg-white z-50 rounded-t-3xl sm:rounded-none flex flex-col shadow-2xl border-t border-neutral-200"
          >
            {/* Mobile Drag Indicator / Header */}
            <div className="flex flex-col items-center pt-3 pb-2 px-6 border-b border-neutral-100 flex-shrink-0">
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full mb-3 sm:hidden" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-black" />
                  <h2 className="text-lg font-bold text-neutral-900">Your Bag ({cart.length})</h2>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Select All Bar */}
              {cart.length > 0 && (
                <div className="w-full flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => toggleSelectAll(!allSelected)}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition cursor-pointer"
                  >
                    {allSelected ? (
                      <CheckSquare size={16} className="text-black" />
                    ) : (
                      <Square size={16} className="text-neutral-400" />
                    )}
                    Select All
                  </button>
                  <span className="text-xs text-neutral-400">{selectedCount} items selected</span>
                </div>
              )}
            </div>

            {/* Scrollable Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-neutral-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag size={48} className="text-neutral-300 mb-3 stroke-[1.5]" />
                  <p className="text-base font-semibold text-neutral-800">Your bag is empty</p>
                  <p className="text-xs text-neutral-400 mt-1 mb-6">Explore the collection to add items.</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-black text-white text-xs font-semibold tracking-wider uppercase rounded-full hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Start Browsing
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const image = item.image || "https://placehold.co/200x260/png?text=Product";
                  const isEditing = editItemId === item.variantId;
                  const isMaxStock = item.stock !== undefined && item.quantity >= item.stock;

                  return (
                    <div key={item.variantId} className="pt-4 first:pt-0 flex gap-3">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelect(item.variantId)}
                        className="mt-2 text-neutral-700 hover:text-black transition self-start cursor-pointer"
                      >
                        {item.selected ? (
                          <CheckSquare size={18} className="text-black" />
                        ) : (
                          <Square size={18} className="text-neutral-400" />
                        )}
                      </button>

                      {/* Image Thumbnail */}
                      <div className="w-20 h-24 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 border border-neutral-200">
                        <img src={image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Details & Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-semibold text-neutral-900 truncate">{item.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <p className="text-xs text-neutral-500 mt-0.5">
                            {item.fabric ? `${item.fabric} · ` : ""}
                            {item.color || "Standard"}
                          </p>

                          {/* Size Selection Toggle */}
                          <div className="mt-1 flex items-center gap-2">
                            {!isEditing ? (
                              <>
                                <span className="text-xs font-medium text-neutral-700">Size: {item.size}</span>
                                {item.variants && item.variants.length > 0 && (
                                  <button
                                    onClick={() => setEditItemId(item.variantId)}
                                    className="text-[10px] text-neutral-500 underline hover:text-black cursor-pointer"
                                  >
                                    Change
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-wrap gap-1 mt-1">
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
                                    className={`px-2 py-0.5 text-[10px] border rounded cursor-pointer ${
                                      v.id === item.variantId
                                        ? "bg-black text-white border-black"
                                        : "border-neutral-300 text-neutral-700"
                                    } ${v.stock === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
                                  >
                                    {v.size}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Quantity Bar */}
                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-sm font-bold text-neutral-900">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>

                          <div className="flex items-center border border-neutral-300 rounded">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1 hover:bg-neutral-100 transition text-neutral-600 cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-medium text-neutral-800">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={isMaxStock}
                              className={`p-1 transition ${
                                isMaxStock ? "opacity-30 cursor-not-allowed" : "hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                              }`}
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
              <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-neutral-900">
                  <span>Subtotal ({selectedCount} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>

                <CheckoutButton items={selectedItems} />

                <p className="text-[11px] text-neutral-400 text-center">
                  Shipping & taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};