"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";

interface CartStickyBarProps {
  onOpenCart: () => void;
}

export const CartStickyBar: React.FC<CartStickyBarProps> = ({ onOpenCart }) => {
  const { cart, getSelectedItems, getSelectedSubtotal } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || cart.length === 0) return null;

  const selectedItems = getSelectedItems();
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getSelectedSubtotal();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40"
      >
        <button
          onClick={onOpenCart}
          className="w-full bg-black/90 backdrop-blur-md text-white p-3.5 px-5 rounded-full shadow-2xl flex items-center justify-between border border-white/20 hover:bg-black transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag size={20} />
              <span className="absolute -top-1.5 -right-2 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {selectedCount}
              </span>
            </div>
            <span className="text-sm font-medium tracking-wide">View Shopping Bag</span>
          </div>

          <span className="text-sm font-bold tracking-tight">₹{subtotal.toLocaleString()}</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};