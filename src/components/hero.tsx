"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { HiOutlineLockClosed, HiOutlineTruck, HiOutlineRefresh } from "react-icons/hi";
import { GiLion } from "react-icons/gi";
import ProductCard from "./productCard";

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  color: string;
  fabric: string;
  category: string;
  images: { url: string; isPrimary: boolean }[];
  variants: { size: string; price: number; stock: number }[];
  createdAt: string;
}

const CATEGORIES = [
  { label: "ALL", value: "" },
  { label: "SHIRTS", value: "shirts" },
  { label: "POLOS", value: "polos" },
  { label: "TROUSERS", value: "trousers" },
];

export default function Hero() {
  const router = useRouter();
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loadingBestsellers, setLoadingBestsellers] = useState(true);

  const currentCategory = (router.query.category as string)?.toLowerCase() || "";

  // Fetch Bestsellers on mount
  useEffect(() => {
    async function fetchBestsellers() {
      try {
        const res = await fetch("/api/product?bestseller=true&limit=6");
        if (res.ok) {
          const data = await res.json();
          setBestsellers(data);
        }
      } catch (err) {
        console.error("Failed to load bestsellers:", err);
      } finally {
        setLoadingBestsellers(false);
      }
    }
    fetchBestsellers();
  }, []);

  // 1. In-place filter handler
  const handleCategoryFilter = (catValue: string) => {
    const { ...restQuery } = router.query;
    
    if (!catValue) {
      delete restQuery.category;
    } else {
      restQuery.category = catValue;
    }

    router.push(
      {
        pathname: router.pathname,
        query: restQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  // 2. Smooth scroll directly to the "SHOP THE COLLECTION" title
  const scrollToCollection = () => {
    const el = document.getElementById("shop-collection");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    /* Pulls hero up flush behind the transparent sticky header */
    <div className="w-full flex flex-col -mt-[66px] sm:-mt-[86px] md:-mt-[88px]">
      {/* ---------------- 1. HERO BANNER ---------------- */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] max-h-[640px] bg-brand-stone overflow-hidden pt-[66px] sm:pt-[86px] md:pt-[88px]">
        {/* Mobile Banner (4:5 Portrait) */}
        <div className="block sm:hidden absolute inset-0">
          <Image
            src="/hero/hero-banner-mobile.avif"
            alt="HIÈR Quiet Luxury Mobile"
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        </div>

        {/* Desktop Banner (16:9 Landscape) */}
        <div className="hidden sm:block absolute inset-0">
          <Image
            src="/hero/hero-banner-desktop.avif"
            alt="HIÈR Quiet Luxury Desktop"
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        </div>

        {/* Gradient Overlay & Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white z-10">
          <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-tight max-w-sm tracking-wide">
            Timeless staples.
            <br />
            Quiet luxury.
          </h1>
          <p className="text-[12px] sm:text-sm text-brand-lightText/90 mt-2 max-w-xs font-light leading-relaxed">
            Crafted for those who understand simplicity is the ultimate sophistication.
          </p>

          <button
            onClick={scrollToCollection}
            className="mt-5 w-fit bg-brand-btn text-brand-bg text-[11px] font-semibold tracking-widest uppercase px-6 py-3 rounded-sm hover:opacity-90 transition-opacity active:scale-95 cursor-pointer"
          >
            EXPLORE COLLECTIONS
          </button>
        </div>
      </section>

      {/* ---------------- 2. TRUST BADGES ---------------- */}
      <section className="bg-brand-card border-y border-brand-border py-5 px-3">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center">
            <HiOutlineLockClosed className="w-5 h-5 text-brand-charcoal stroke-[1.4] mb-1" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-brand-charcoal leading-tight">
              SECURE<br />PAYMENTS
            </span>
            <span className="text-[8px] text-brand-textSec mt-0.5">Razorpay</span>
          </div>

          <div className="flex flex-col items-center">
            <HiOutlineTruck className="w-5 h-5 text-brand-charcoal stroke-[1.4] mb-1" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-brand-charcoal leading-tight">
              EXPRESS<br />SHIPPING
            </span>
            <span className="text-[8px] text-brand-textSec mt-0.5">by Shiprocket</span>
          </div>

          <div className="flex flex-col items-center">
            <HiOutlineRefresh className="w-5 h-5 text-brand-charcoal stroke-[1.4] mb-1" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-brand-charcoal leading-tight">
              EASY<br />72HR RETURNS
            </span>
          </div>

          <div className="flex flex-col items-center">
            <GiLion className="w-5 h-5 text-brand-charcoal mb-1" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-brand-charcoal leading-tight">
              MADE<br />IN INDIA
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- 3. BESTSELLERS SECTION ---------------- */}
      <section className="pt-7 pb-2 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-3 px-4 sm:px-6 md:px-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-brand-charcoal uppercase">
            BESTSELLERS
          </h2>
          <button
            onClick={scrollToCollection}
            className="text-[11px] font-semibold tracking-wider text-brand-textSec hover:text-brand-charcoal underline underline-offset-4 uppercase cursor-pointer"
          >
            View all
          </button>
        </div>

        {/* Fluid Mobile Scroll Track */}
        <div className="flex md:grid md:grid-cols-4 gap-3.5 md:gap-6 overflow-x-auto snap-x snap-proximity overscroll-x-contain scroll-pl-4 sm:scroll-pl-6 px-4 sm:px-6 md:px-12 pt-0 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {loadingBestsellers ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-[170px] sm:w-[220px] md:w-full flex-shrink-0 snap-start animate-pulse"
              >
                <div className="aspect-[3/4] bg-brand-stone/60 rounded-sm" />
                <div className="h-3 bg-brand-stone/80 rounded mt-2 w-3/4" />
                <div className="h-3 bg-brand-stone/50 rounded mt-1.5 w-1/2" />
              </div>
            ))
          ) : bestsellers.length > 0 ? (
            bestsellers.map((product) => (
              <div
                key={product.id}
                className="w-[170px] sm:w-[220px] md:w-full flex-shrink-0 snap-start"
              >
                <ProductCard product={product} priority={false} />
              </div>
            ))
          ) : null}

          <div className="w-1 shrink-0 md:hidden" />
        </div>
      </section>

      {/* ---------------- 4. EDITORIAL QUOTE BANNER ---------------- */}
      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[320px] bg-brand-stone overflow-hidden my-4 sm:my-6">
  {/* Mobile Banner (16:9 / 2:1) */}
  <div className="block sm:hidden absolute inset-0">
    <Image
      src="/hero/editorial-strip-mobile.avif"
      alt="HIÈR Editorial Mood"
      fill
      className="object-cover object-center"
      sizes="100vw"
    />
  </div>

  {/* Desktop Banner (21:9 Ultra-Wide Ribbon) */}
  <div className="hidden sm:block absolute inset-0">
    <Image
      src="/hero/editorial-strip-desktop.avif"
      alt="HIÈR Editorial Mood"
      fill
      className="object-cover object-center"
      sizes="100vw"
    />
  </div>

  {/* Subtle Vignette / Contrast Overlay */}
  <div className="absolute inset-0 bg-black/15 pointer-events-none" />
</section>

      {/* ---------------- 5. SHOP THE COLLECTION (SCROLL TARGET) ---------------- */}
      <section id="shop-collection" className="scroll-mt-20 px-4 sm:px-6 pt-2 pb-2 max-w-4xl mx-auto w-full">
        <h2 className="text-[13px] font-bold tracking-[0.2em] text-brand-charcoal uppercase mb-3 text-center sm:text-left">
          SHOP THE COLLECTION
        </h2>

        <div className="grid grid-cols-4 bg-brand-stone/60 p-1 rounded-sm border border-brand-border">
          {CATEGORIES.map((cat) => {
            const isActive =
              cat.value === currentCategory || (!cat.value && !currentCategory);
            return (
              <button
                key={cat.label}
                onClick={() => handleCategoryFilter(cat.value)}
                className={`py-2 text-[11px] font-semibold tracking-wider uppercase transition-all rounded-[2px] cursor-pointer ${
                  isActive
                    ? "bg-brand-olive text-white shadow-sm"
                    : "text-brand-charcoal hover:text-black"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}