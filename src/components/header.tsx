"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Menu,
  X,
  User,
  Package,
  LogOut,
  LogIn,
  ChevronRight,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AnimatedLogo from "./animatedLogo";
import { AuthModal } from "./authModal";

const CATEGORIES = [
  { label: "ALL", value: "" },
  { label: "SHIRTS", value: "shirts" },
  { label: "POLOS", value: "polos" },
  { label: "TROUSERS", value: "trousers" },
];

export const Header: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  // Drawer & Modal States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search Expand State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const scrollToProducts = () => {
    const el =
      document.getElementById("shop-collection") ||
      document.getElementById("catalog") ||
      document.getElementById("products-grid");

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearch = async () => {
    setSearchOpen(false);

    const nextQuery: Record<string, any> = { ...router.query };
    if (searchTerm.trim()) {
      nextQuery.search = searchTerm.trim();
    } else {
      delete nextQuery.search;
    }

    if (selectedCategory) {
      nextQuery.category = selectedCategory;
    } else {
      delete nextQuery.category;
    }

    const isHome = router.pathname === "/";

    await router.push(
      {
        pathname: isHome ? router.pathname : "/",
        query: nextQuery,
      },
      undefined,
      { shallow: isHome }
    );

    setTimeout(() => {
      scrollToProducts();
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleProtectedNav = (path: string) => {
    setIsMenuOpen(false);
    if (!isLoggedIn) {
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectIntent", path);
      }
      toast.error("Please sign in or register first");
      setIsAuthModalOpen(true);
      return;
    }
    router.push(path);
  };

  const isNavbarActive = searchOpen || isMenuOpen;

  return (
    <>
      {/* ---------------- 1. STICKY TRANSPARENT NAVBAR & BANNER ---------------- */}
      <header
        className={`sticky top-0 z-50 w-full select-none transition-colors duration-300 ${
          isNavbarActive
            ? "bg-white border-b border-brand-border shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        {/* ---------------- 1. INFINITE ROTATING ANNOUNCEMENT BANNER ---------------- */}
        <div className="relative z-50 w-full bg-brand-charcoal text-brand-bg text-[9px] xs:text-[10px] sm:text-[11px] tracking-[0.16em] uppercase py-1.5 overflow-hidden select-none whitespace-nowrap">
          <div className="flex w-max items-center animate-marquee hover:[animation-play-state:paused]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 font-medium">
                <span>2% Off on Prepaid • 3% Off on 2 Items • 5% Off on 3+ Items (Auto applied)</span>
                <span>2% Off on Prepaid • 3% Off on 2 Items • 5% Off on 3+ Items (Auto applied)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-16">
          <div className="relative flex items-center justify-between h-16">
            {/* Left: Brand Logo */}
            <div className="flex items-center flex-shrink-0 z-10">
              <Link 
                href="/" 
                className="flex items-center scale-[0.85] sm:scale-[0.92] origin-left transition-transform"
              >
                <AnimatedLogo />
              </Link>
            </div>

            {/* Center-Right: Elongated Search Bar */}
            {/* Center-Right: Elongated Search Bar */}
<div className="absolute top-1/2 left-[54%] sm:left-[53%] -translate-x-1/2 -translate-y-1/2 translate-y-[calc(-50%+4px)] w-[44%] xs:w-[48%] sm:w-[320px] md:w-[420px] lg:w-[500px]">
  <button
    onClick={() => setSearchOpen((prev) => !prev)}
    className={`w-full h-8 sm:h-9 px-3 sm:px-4 border rounded-full flex items-center text-xs transition-all shadow-xs cursor-pointer group backdrop-blur-md ${
      searchOpen
        ? "bg-white/80 border-brand-charcoal text-brand-charcoal"
        : "bg-white/20 sm:bg-white/60 hover:bg-white/85 border-brand-border/70 hover:border-brand-charcoal/50 text-brand-textSec"
    }`}
    aria-label="Search"
  >
    <div className="flex items-center gap-2 w-full truncate">
      <Search
        size={14}
        className="text-brand-textSec group-hover:text-brand-charcoal transition-colors stroke-[1.8] flex-shrink-0"
      />
      <span className="truncate text-[10px] sm:text-xs text-left">
        {searchTerm
          ? searchTerm
          : "Search for shirts, polos, trousers..."}
      </span>
    </div>
  </button>
</div>

            {/* Right: Hamburger Menu */}
            <div className="relative flex items-center flex-shrink-0 z-10 translate-x-[0px] translate-y-[4px] sm:translate-x-[0px] sm:translate-y-[0px]">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-1.5 sm:p-2 text-brand-charcoal hover:text-brand-olive transition-colors cursor-pointer rounded-full active:bg-brand-stone/30"
                aria-label="Open navigation menu"
              >
                <Menu size={20} className="h-[30px] w-[25px] sm:w-[22px] sm:h-[22px] stroke-[2.4]" />
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- 3. INLINE EXPANDABLE SEARCH PANEL ---------------- */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeInOut" }}
              className="overflow-hidden bg-white border-t border-brand-border shadow-lg"
            >
              <div className="max-w-2xl mx-auto p-3.5 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-2.5 sm:top-3 text-brand-textSec"
                      size={15}
                    />
                    <input
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type to search..."
                      className="w-full h-9 sm:h-10 bg-brand-bg border border-brand-border rounded-sm pl-8 sm:pl-9 pr-3 outline-none text-xs sm:text-sm text-brand-charcoal placeholder:text-brand-textSec/70 focus:border-brand-charcoal transition-colors shadow-xs"
                    />
                  </div>
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 sm:p-2 text-brand-textSec hover:text-brand-charcoal hover:bg-brand-stone/30 rounded-full transition cursor-pointer"
                    aria-label="Close search"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <span className="text-brand-textSec font-medium tracking-wide uppercase text-[9px] sm:text-[10px] mr-1 flex-shrink-0">
                    Filter:
                  </span>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-2.5 sm:px-3 py-1 rounded-sm border text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase transition cursor-pointer flex-shrink-0 ${
                        selectedCategory === cat.value
                          ? "bg-brand-btn text-white border-brand-btn shadow-xs"
                          : "bg-brand-card text-brand-charcoal border-brand-border hover:border-brand-charcoal"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-0.5">
                  <button
                    onClick={handleSearch}
                    className="w-full sm:w-auto bg-brand-btn text-white px-5 py-2 rounded-sm text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition shadow-xs cursor-pointer text-center"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------- 4. RIGHT-SIDE NAVIGATION DRAWER ---------------- */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[320px] sm:max-w-sm h-[100dvh] bg-brand-bg z-50 shadow-2xl flex flex-col border-l border-brand-border overflow-y-auto"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-brand-border bg-brand-bg flex-shrink-0">
                <span className="font-serif text-xs font-medium uppercase tracking-[0.2em] text-brand-charcoal">
                  Account & Menu
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 text-brand-textSec hover:text-brand-charcoal hover:bg-brand-stone/30 rounded-full transition cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-3.5 sm:p-5 bg-brand-card border-b border-brand-border flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-stone/30 border border-brand-border flex items-center justify-center text-brand-charcoal font-bold overflow-hidden flex-shrink-0">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={17} className="text-brand-charcoal stroke-[1.6]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-xs sm:text-sm font-medium text-brand-charcoal tracking-wide truncate">
                    {isLoggedIn
                      ? session?.user?.name || "Valued Client"
                      : "Welcome"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-brand-textSec truncate">
                    {isLoggedIn
                      ? session?.user?.email ||
                        (session?.user as any)?.phoneNumber ||
                        ""
                      : "Sign in to access your account"}
                  </p>
                </div>
              </div>

              {/* Sign In / Log Out Button */}
              <div className="p-3 sm:p-4 border-b border-brand-border bg-brand-bg flex-shrink-0">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="w-full py-2.5 px-4 bg-red-50/80 border border-red-200 text-red-700 hover:bg-red-100 text-[10px] font-semibold uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-brand-btn text-white hover:opacity-90 text-[10px] font-semibold uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <LogIn size={14} />
                    <span>Sign In / Register</span>
                  </button>
                )}
              </div>

              {/* Account Links */}
              <div className="px-4 pt-3.5 pb-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-brand-textSec">
                Account
              </div>

              <nav className="p-2 space-y-1 flex-1">
                {session?.user?.isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleProtectedNav("/admin/dashboard")}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wider uppercase text-brand-charcoal hover:bg-brand-card rounded-sm transition-colors cursor-pointer text-left"
                  >
                    <Shield size={15} className="text-brand-textSec stroke-[1.6]" />
                    <span className="flex-1 font-serif">Admin Dashboard</span>
                    <ChevronRight size={14} className="text-brand-textSec" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleProtectedNav("/orders/orders-page")}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wider uppercase text-brand-charcoal hover:bg-brand-card rounded-sm transition-colors cursor-pointer text-left"
                >
                  <Package size={15} className="text-brand-textSec stroke-[1.6]" />
                  <span className="flex-1 font-serif">Your Orders</span>
                  <ChevronRight size={14} className="text-brand-textSec" />
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedNav("/profile")}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wider uppercase text-brand-charcoal hover:bg-brand-card rounded-sm transition-colors cursor-pointer text-left"
                >
                  <User size={15} className="text-brand-textSec stroke-[1.6]" />
                  <span className="flex-1 font-serif">Profile Settings</span>
                  <ChevronRight size={14} className="text-brand-textSec" />
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---------------- 5. AUTHENTICATION MODAL ---------------- */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;