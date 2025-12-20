import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ShoppingBag, Search, User, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./animatedLogo";

const Header: React.FC = () => {
  const router = useRouter();
  const { cart } = useCartStore();
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

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
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
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

          {/* Icons */}
          <div className="flex items-center gap-3">
            <motion.button onClick={() => setSearchOpen(true)} className="md:hidden p-2 text-neutral-500 hover:text-black">
              <Search size={20} />
            </motion.button>

            <Link href="/cart" className="relative p-2 text-neutral-500 hover:text-black">
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </motion.span>
              )}
            </Link>

            <Link href={"/profile"}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 text-neutral-500 hover:text-black">
                <User size={22} />
              </motion.button>
            </Link>
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
                <button onClick={() => setSearchOpen(false)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200">
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
                    className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800"
                 >
                    Show Results
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;