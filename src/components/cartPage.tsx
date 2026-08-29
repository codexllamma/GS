"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Minus, ArrowLeft, X, CheckSquare, Square } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { CheckoutButton } from "@/components/checkoutButton";

const CartPage: React.FC = () => {
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

  /*
  -----------------------------------------------------------
  SKELETON LOADER (L3)
  -----------------------------------------------------------
  */
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-neutral-200">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
        <div className="w-full max-w-[180px] sm:w-40 lg:w-48 aspect-[3/4] bg-neutral-200 rounded-lg sm:rounded-xl"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
          <div className="h-3 w-1/4 bg-neutral-200 rounded"></div>
          <div className="h-8 w-1/2 bg-neutral-200 rounded"></div>
          <div className="flex gap-3 mt-4">
            <div className="h-10 w-28 bg-neutral-200 rounded-md" />
            <div className="h-10 w-20 bg-neutral-200 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
          <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isHydrated && cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-neutral-50 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-light text-neutral-800 mb-2"
        >
          Your bag is empty
        </motion.h1>
        <p className="text-neutral-500 mb-6 text-sm sm:text-base">
          Add something to make it yours.
        </p>
        <Link href="/product/products">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="px-8 py-3 bg-black text-white text-sm tracking-wide rounded-full hover:opacity-90 transition duration-350"
          >
            Continue Shopping
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-14">
        <Link
          href="/"
          className="inline-flex items-center text-neutral-600 hover:text-black mb-8 sm:mb-12 text-sm transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Continue shopping
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-light text-neutral-900">
            Your Shopping Bag
          </h1>

          {/* SELECT ALL TOGGLE */}
          <button
            onClick={() => toggleSelectAll(!allSelected)}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black transition-colors cursor-pointer"
          >
            {allSelected ? (
              <CheckSquare size={20} className="text-black" />
            ) : (
              <Square size={20} className="text-neutral-400" />
            )}
            Select All ({cart.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[62%_38%] gap-6 lg:gap-12">
          {/* LEFT — ITEMS */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <AnimatePresence>
              {cart.map((item) => {
                const image = item.image || "/placeholder.png";
                const isEditing = editItemId === item.variantId;
                const isMaxStock = item.stock !== undefined && item.quantity >= item.stock;

                return (
                  <motion.div
                    key={item.variantId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border transition-all ${
                      item.selected
                        ? "border-neutral-900"
                        : "border-neutral-200 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
                      {/* CHECKBOX */}
                      <button
                        onClick={() => toggleSelect(item.variantId)}
                        className="mt-1 text-neutral-800 hover:text-black transition-colors cursor-pointer"
                        aria-label="Select item"
                      >
                        {item.selected ? (
                          <CheckSquare size={22} className="text-black" />
                        ) : (
                          <Square size={22} className="text-neutral-400" />
                        )}
                      </button>

                      {/* IMG */}
                      <div className="w-full max-w-[180px] sm:w-40 lg:w-48 aspect-[3/4] bg-neutral-100 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            className="text-lg sm:text-xl font-medium text-neutral-900 hover:underline flex-1"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.variantId)}
                            className="sm:hidden text-neutral-400 hover:text-neutral-900 transition p-1 cursor-pointer"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-neutral-500">
                          Fabric: {item.fabric ?? "—"} · Color: {item.color ?? "—"}
                        </p>

                        {/* SIZE */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                          {!isEditing ? (
                            <>
                              <p className="text-sm text-neutral-700">
                                Size: <span className="font-medium">{item.size}</span>
                              </p>
                              {item.variants && item.variants.length > 0 && (
                                <button
                                  onClick={() => setEditItemId(item.variantId)}
                                  className="text-xs text-neutral-600 border border-neutral-300 px-3 py-1 rounded-md hover:text-black hover:border-black transition-all duration-350 cursor-pointer"
                                >
                                  Change
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2 w-full">
                              {item.variants?.map((variant) => (
                                <button
                                  key={variant.id}
                                  onClick={() => {
                                    updateVariant(item.variantId, {
                                      id: variant.id,
                                      size: variant.size,
                                      price: variant.price,
                                      stock: variant.stock,
                                    });
                                    setEditItemId(null);
                                  }}
                                  disabled={variant.stock === 0}
                                  className={`border px-3 sm:px-4 py-1 text-xs rounded-md transition-all ${
                                    variant.stock === 0
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:border-black cursor-pointer"
                                  } ${
                                    variant.id === item.variantId
                                      ? "border-black bg-black text-white"
                                      : "border-neutral-300"
                                  }`}
                                >
                                  {variant.size}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <p className="text-lg sm:text-xl font-medium text-neutral-900 mt-2 sm:mt-3">
                          ₹{item.price.toLocaleString()}
                        </p>

                        {/* QTY + REMOVE */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 mt-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center border border-neutral-300 rounded-md w-full sm:w-auto">
                              <button
                                onClick={() =>
                                  updateQuantity(item.variantId, item.quantity - 1)
                                }
                                className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-neutral-100 transition flex-1 sm:flex-initial flex items-center justify-center cursor-pointer"
                              >
                                <Minus size={14} />
                              </button>

                              <span className="px-4 sm:px-6 text-sm font-medium text-neutral-800 border-x border-neutral-200 min-w-[3rem] text-center">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  updateQuantity(item.variantId, item.quantity + 1)
                                }
                                disabled={isMaxStock}
                                className={`px-3 sm:px-4 py-2 sm:py-2.5 transition flex-1 sm:flex-initial flex items-center justify-center ${
                                  isMaxStock
                                    ? "opacity-30 cursor-not-allowed bg-neutral-50"
                                    : "hover:bg-neutral-100 cursor-pointer"
                                }`}
                                title={isMaxStock ? "Maximum available stock reached" : "Increase quantity"}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* STOCK WARNING IF AT CAPACITY */}
                            {isMaxStock && (
                              <span className="text-[11px] text-amber-600">
                                Max stock limit ({item.stock}) reached
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => removeFromCart(item.variantId)}
                            className="hidden sm:block text-sm border border-neutral-900 text-neutral-900 rounded-md px-5 py-2 hover:bg-neutral-900 hover:text-white transition-all duration-350 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* SUMMARY */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-sm border border-neutral-200 lg:h-fit lg:sticky lg:top-20">
            <h2 className="text-xl sm:text-2xl font-medium text-neutral-900 mb-5 sm:mb-6">
              Order Summary
            </h2>

            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-neutral-700 mb-6 sm:mb-8">
              <div className="flex justify-between">
                <span>Items ({selectedCount})</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <hr className="border-neutral-200" />
              <div className="flex justify-between text-neutral-900 font-semibold text-base sm:text-lg">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
            </div>

            <CheckoutButton items={selectedItems} />

            <p className="text-xs text-neutral-500 text-center mt-4">
              Taxes calculated at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;