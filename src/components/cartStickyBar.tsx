"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";

interface CartStickyBarProps {
  onOpenCart: () => void;
}

export const CartStickyBar: React.FC<CartStickyBarProps> = ({ onOpenCart }) => {
  const { cart } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || cart.length === 0) return null;

  // Calculate total count and total value for all items in bag
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 35, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 35, opacity: 0, scale: 0.96 }}
        transition={{
          duration: 0.28,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] z-40 transform-gpu"
      >
        <button
          onClick={onOpenCart}
          className="w-full bg-brand-charcoal/95 backdrop-blur-md text-white py-3.5 px-5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.25)] flex items-center justify-between border border-white/10 hover:bg-brand-charcoal transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag size={18} className="stroke-[1.7]" />
              <span className="absolute -top-1.5 -right-2 bg-brand-btn text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {totalItemCount}
              </span>
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase">
              Shopping Bag
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-lightText/70 font-light">Total:</span>
            <span className="text-sm font-semibold tracking-tight">
              ₹{totalCartPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};