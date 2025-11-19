"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Minus, ArrowLeft, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { CheckoutButton } from "@/components/checkoutButton"; 

const CartPage: React.FC = () => {
  const { data: session, status } = useSession();
  const isAuth = !!session && status === "authenticated";

  const { cart, updateQuantity, updateVariant, removeFromCart, fetchCart } =
    useCartStore();

  const [isLoaded, setIsLoaded] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    // Wait for session resolution first
    if (status === "loading") return;

    await fetchCart(isAuth);
    setIsLoaded(true);
  }, [fetchCart, isAuth, status]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * (item.variant?.product?.basePrice || 0),
    0
  );

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

  if (!isLoaded) {
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

  if (isLoaded && cart.length === 0) {
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
          href="/dashboard"
          className="inline-flex items-center text-neutral-600 hover:text-black mb-8 sm:mb-12 text-sm transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Continue shopping
        </Link>

        <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-8 sm:mb-12">
          Your Shopping Bag
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[62%_38%] gap-6 lg:gap-12">
          {/* LEFT — ITEMS */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <AnimatePresence>
              {cart.map((item) => {
                const product = item.variant.product;
                const image = product.images?.[0]?.url || "/placeholder.png";
                const isEditing = editItemId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-neutral-200"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
                      {/* IMG */}
                      <div className="w-full max-w-[180px] sm:w-40 lg:w-48 aspect-[3/4] bg-neutral-100 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={image}
                          alt={product.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${product.id}`}
                            className="text-lg sm:text-xl font-medium text-neutral-900 hover:underline flex-1"
                          >
                            {product.name}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.id, isAuth)}
                            className="sm:hidden text-neutral-400 hover:text-neutral-900 transition p-1"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-neutral-500">
                          Fabric: {product.fabric?.name ?? "—"} · Color: {product.color}
                        </p>

                        {/* SIZE */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                          {!isEditing ? (
                            <>
                              <p className="text-sm text-neutral-700">
                                Size:{" "}
                                <span className="font-medium">{item.variant.size}</span>
                              </p>
                              <button
                                onClick={() => setEditItemId(item.id)}
                                className="text-xs text-neutral-600 border border-neutral-300 px-3 py-1 rounded-md hover:text-black hover:border-black transition-all duration-350"
                              >
                                Change
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2 w-full">
                              {product.variants?.map((variant) => (
                                <button
                                  key={variant.id}
                                  onClick={() => {
                                    updateVariant(item.id, variant.id, isAuth);
                                    setEditItemId(null);
                                  }}
                                  disabled={variant.stock === 0}
                                  className={`border px-3 sm:px-4 py-1 text-xs rounded-md transition-all ${
                                    variant.stock === 0
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:border-black"
                                  } ${
                                    variant.id === item.variant.id
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
                          ₹{product.basePrice.toLocaleString()}
                        </p>

                        {/* QTY + REMOVE */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 mt-4">
                          <div className="flex items-center border border-neutral-300 rounded-md w-full sm:w-auto">
                            <button
                              onClick={() => {
                                if (item.quantity > 1)
                                  updateQuantity(item.id, item.quantity - 1, isAuth);
                              }}
                              className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-neutral-100 transition flex-1 sm:flex-initial flex items-center justify-center"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="px-4 sm:px-6 text-sm font-medium text-neutral-800 border-x border-neutral-200 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1, isAuth)
                              }
                              className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-neutral-100 transition flex-1 sm:flex-initial flex items-center justify-center"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id, isAuth)}
                            className="hidden sm:block text-sm border border-neutral-900 text-neutral-900 rounded-md px-5 py-2 hover:bg-neutral-900 hover:text-white transition-all duration-350"
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
                <span>Items ({items})</span>
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

            <CheckoutButton />

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
