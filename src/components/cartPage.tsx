import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";

const CartPage: React.FC = () => {
  const { cart, updateQuantity, updateVariant, removeFromCart, fetchCart } =
    useCartStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart().then(() => setIsLoaded(true));
  }, [fetchCart]);

  const items = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * (item.variant?.product?.basePrice || 0),
    0
  );

  if (isLoaded && cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-neutral-50">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light text-neutral-800 mb-2"
        >
          Your bag is empty
        </motion.h1>
        <p className="text-neutral-500 mb-6">
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
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-neutral-600 hover:text-black mb-12 text-sm transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Continue shopping
        </Link>

        <h1 className="text-4xl font-light text-neutral-900 mb-12">
          Your Shopping Bag
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-12">
          {/* LEFT — ITEMS */}
          <div className="space-y-8">
            <AnimatePresence>
              {isLoaded &&
                cart.map((item) => {
                  const product = item.variant.product;
                  const image = product.images?.[0]?.url || "/placeholder.png";
                  const isEditing = editItemId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200"
                    >
                      <div className="flex items-start gap-8">
                        {/* Product image */}
                        <div className="w-48 h-60 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={image}
                            alt={product.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>

                        {/* Product details */}
                        <div className="flex-1 space-y-3">
                          <Link
                            href={`/product/${product.id}`}
                            className="block text-xl font-medium text-neutral-900 hover:underline"
                          >
                            {product.name}
                          </Link>

                          <p className="text-sm text-neutral-500">
                            Fabric: {product.fabric?.name ?? "—"} · Color:{" "}
                            {product.color}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            {!isEditing ? (
                              <>
                                <p className="text-sm text-neutral-700">
                                  Size: {item.variant.size}
                                </p>
                                <button
                                  onClick={() => setEditItemId(item.id)}
                                  className="text-xs text-neutral-600 border border-neutral-300 px-3 py-1 rounded-md hover:text-black hover:border-black transition-all duration-350"
                                >
                                  Change
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {product.variants?.map((variant) => (
                                  <button
                                    key={variant.id}
                                    onClick={() => {
                                      updateVariant(item.id, variant.id);
                                      setEditItemId(null);
                                    }}
                                    disabled={variant.stock === 0}
                                    className={`border px-4 py-1 text-xs rounded-md transition-all ${
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

                          <p className="text-lg font-medium text-neutral-900 mt-2">
                            ₹{product.basePrice.toLocaleString()}
                          </p>

                          <div className="flex items-center gap-6 mt-4">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-neutral-300 rounded-md">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1)
                                    updateQuantity(item.id, item.quantity - 1);
                                }}
                                className="px-3 py-2 hover:bg-neutral-100 transition"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-4 text-sm font-medium text-neutral-800 border-x border-neutral-200 min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="px-3 py-2 hover:bg-neutral-100 transition"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-sm border border-neutral-900 text-neutral-900 rounded-md px-5 py-2 hover:bg-neutral-900 hover:text-white transition-all duration-350"
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

          {/* RIGHT — SUMMARY */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 h-fit sticky top-20">
            <h2 className="text-2xl font-medium text-neutral-900 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 text-base text-neutral-700 mb-8">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <hr className="border-neutral-200" />
              <div className="flex justify-between text-neutral-900 font-semibold text-lg">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
            </div>

            <Link href="/checkout">
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-black text-white py-4 rounded-[2px] font-medium tracking-wide text-base hover:opacity-90 transition"
              >
                Proceed to Checkout
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
