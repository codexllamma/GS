// src/components/Header.tsx
import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Search, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./animatedLogo";

const Header: React.FC = () => {
  const { cart } = useCartStore();
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4">

        {/* FLEX HEADER */}
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* LEFT — LOGO */}
          <Link href="/dashboard" className="flex items-center">
            <AnimatedLogo />
          </Link>

          {/* CENTER — DESKTOP SEARCH */}
          <div className="hidden md:flex flex-1 justify-center">
            {!searchOpen && (
              <motion.button
                onClick={() => setSearchOpen(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="
                  flex items-center 
                  w-72 lg:w-[30rem]
                  h-11 rounded-full
                  bg-neutral-100
                  px-8
                  text-base
                  text-neutral-500
                  hover:text-black
                  transition
                "
              >
                <Search size={18} className="mr-2" />
                Search
              </motion.button>
            )}
          </div>

          {/* RIGHT — ICONS */}
          <div className="flex items-center gap-3">

            {/* Mobile search */}
            <motion.button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 text-neutral-500 hover:text-black"
            >
              <Search size={20} />
            </motion.button>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-neutral-500 hover:text-black">
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-neutral-500 hover:text-black"
            >
              <User size={22} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-14 md:top-16 bg-white border-b border-neutral-200 shadow-sm p-4 z-40"
          >
            <div className="flex items-center gap-3">
              <input
                autoFocus
                placeholder="Search products..."
                className="flex-1 h-10 bg-neutral-100 rounded-lg px-3 outline-none text-sm"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="px-4 py-2 bg-neutral-200 rounded-md text-sm hover:bg-neutral-300"
              >
                Close
              </button>
            </div>

            <div className="flex gap-3 mt-4 overflow-x-auto text-sm text-neutral-600">
              <button className="px-3 py-1 bg-neutral-100 rounded-full">Men</button>
              <button className="px-3 py-1 bg-neutral-100 rounded-full">New Arrivals</button>
              <button className="px-3 py-1 bg-neutral-100 rounded-full">Best Sellers</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
