"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut, signIn } from "next-auth/react";
import { Search, Menu, X, User, Package, LogOut, LogIn, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./animatedLogo";

const Header: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  // Menu Drawer State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Fetch categories only once when the user opens search
  useEffect(() => {
    if (searchOpen && categories.length === 0) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data))
        .catch((err) => console.error(err));
    }
  }, [searchOpen, categories.length]);

  const handleSearch = () => {
    setSearchOpen(false);
    // Push to the product page with query params
    router.push({
      pathname: "/product/products",
      query: {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <AnimatedLogo />
          </Link>

          {/* Desktop Search Trigger */}
          <div className="hidden md:flex flex-1 justify-center">
            {!searchOpen && (
              <motion.button
                onClick={() => setSearchOpen(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center w-72 lg:w-[30rem] h-11 rounded-full bg-neutral-100 px-8 text-base text-neutral-500 hover:text-black transition"
              >
                <Search size={18} className="mr-2" />
                Search products...
              </motion.button>
            )}
          </div>

          {/* Right Action Icons (Search + Hamburger Menu) */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setSearchOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 text-neutral-500 hover:text-black transition"
              aria-label="Search"
            >
              <Search size={20} />
            </motion.button>

            {/* Hamburger Menu Trigger */}
            <motion.button
              onClick={() => setIsMenuOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-neutral-800 hover:text-black transition focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <Menu size={24} />
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
            className="absolute left-0 right-0 top-14 md:top-16 bg-white border-b border-neutral-200 shadow-md p-4 z-40"
          >
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for polos, shirts..."
                    className="w-full h-10 bg-neutral-100 rounded-lg pl-10 pr-3 outline-none text-sm"
                  />
                </div>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* FILTER BUTTONS */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-neutral-400 mr-2">Filter by:</span>
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-3 py-1 rounded-full border transition ${
                    selectedCategory === ""
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1 rounded-full border transition ${
                      selectedCategory === cat.name
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSearch}
                  className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
                >
                  Show Results
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HAMBURGER SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Translucent Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* 70% Width Right Slide-Over Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-[72vw] max-w-xs sm:max-w-sm bg-white z-50 shadow-2xl flex flex-col justify-between border-l border-neutral-200"
            >
              <div>
                {/* Drawer Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-100">
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Menu
                  </span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Profile Banner */}
                <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-bold overflow-hidden flex-shrink-0">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {isLoggedIn ? session?.user?.name || "Valued Customer" : "Welcome Guest"}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {isLoggedIn ? session?.user?.email || "" : "Sign in to manage orders"}
                    </p>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="p-3 space-y-1">
                  <Link
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
                  >
                    <span>Home & Catalog</span>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </Link>

                  <Link
                    href="/orders/orders-page"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
                  >
                    <Package size={18} className="text-neutral-500" />
                    <span className="flex-1">Your Orders</span>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </Link>

                  {isLoggedIn && (
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
                    >
                      <User size={18} className="text-neutral-500" />
                      <span className="flex-1">Profile Settings</span>
                      <ChevronRight size={16} className="text-neutral-400" />
                    </Link>
                  )}
                </nav>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="p-4 border-t border-neutral-100 bg-neutral-50">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="w-full py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signIn();
                    }}
                    className="w-full py-3 px-4 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn size={16} />
                    Sign In / Register
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
