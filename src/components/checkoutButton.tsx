"use client";
import { motion } from "framer-motion";
import { useAuthGate } from "@/hooks/useAuthGate";

export const CheckoutButton = () => {
  const { guardCheckout } = useAuthGate();

  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={guardCheckout}
      className="w-full bg-black text-white py-3.5 sm:py-4 rounded-md font-medium tracking-wide text-sm sm:text-base hover:opacity-90 transition"
    >
      Proceed to Checkout
    </motion.button>
  );
};
