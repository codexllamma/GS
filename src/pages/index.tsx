"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/header";
import Hero from "@/components/hero";
import ProductsGrid from "@/components/productGrid";
import Footer from "@/components/footer";
import { CartSheet } from "@/components/cartSheet";
import { CartStickyBar } from "@/components/cartStickyBar";
import { ProductModal } from "@/components/productModal";
import { CheckoutSummaryModal } from "@/components/checkoutSummaryModal";

export default function Home() {
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const initialScrollExecuted = useRef(false);

  useEffect(() => {
    // 1. Wait until Next.js router query params are fully populated on client
    if (!router.isReady || initialScrollExecuted.current) return;

    const { category, search, filter } = router.query;

    if (category || search || filter) {
      // 2. Small RAF tick to ensure DOM elements and layout heights have painted
      const timer = setTimeout(() => {
        const targetElement = document.getElementById("catalog-section");

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          initialScrollExecuted.current = true;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [router.isReady, router.query]);

  // Read `?product=id` from URL query string
  const activeProductId =
    typeof router.query.product === "string" ? router.query.product : null;

  const handleCloseProductModal = () => {
    const { product, ...restQuery } = router.query;
    router.push({ query: restQuery }, undefined, { shallow: true });
  };

  const handleSelectProduct = (productId: string) => {
    router.push({ query: { ...router.query, product: productId } }, undefined, {
      shallow: true,
    });
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-charcoal selection:bg-brand-olive selection:text-white flex flex-col">
      {/* Header Bar */}
      <Header />

      {/* Main Hero & Shop Categories */}
      <Hero />

      {/* Dynamic Products Grid with Infinite Scroll */}
      <div id="catalog-section" className="w-full pt-2 scroll-mt-20">
        <ProductsGrid />
      </div>

      {/* ---------------- THE HIÈR PROMISE SECTION ---------------- */}
<section className="w-full m-0 p-0">
  <Link
    href="/legal/about"
    className="group relative block w-full aspect-[4/3] sm:aspect-[21/9] max-h-[580px] bg-brand-stone overflow-hidden border-t border-brand-border border-b-0 -mb-[1px]"
    aria-label="Learn more about The HIÈR Promise"
  >
    {/* Mobile Banner (4:3) */}
    <div className="block sm:hidden absolute inset-0">
      <Image
        src="/hero/learn-more-mobile.avif"
        alt="The HIÈR Promise"
        fill
        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.015]"
        sizes="100vw"
      />
    </div>

    {/* Desktop Banner (21:9 Widescreen) */}
    <div className="hidden sm:block absolute inset-0">
      <Image
        src="/hero/learn-more-desktop.avif"
        alt="The HIÈR Promise"
        fill
        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.015]"
        sizes="100vw"
      />
    </div>

    {/* Desktop Interactive Button Overlay */}
    <div className="hidden sm:flex absolute left-[5.8%] top-[64%] items-center gap-1.5 text-[11px] lg:text-xs font-semibold tracking-[0.2em] uppercase text-[#e2d7c5] group-hover:text-white transition-colors select-none">
      <span className="underline underline-offset-4 decoration-[#e2d7c5]/50 group-hover:decoration-white">
        LEARN MORE
      </span>
      <span className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </div>
  </Link>
</section>

      {/* Editorial Footer */}
      <Footer />

      {/* Floating Bottom Cart CTA Bar */}
      <CartStickyBar onOpenCart={() => setIsCartOpen(true)} />

      {/* Cart Drawer */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenSummary={() => setIsSummaryOpen(true)}
        onSelectProduct={handleSelectProduct}
      />

      {/* Checkout Summary Confirmation Drawer */}
      <CheckoutSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onBackToCart={() => {
          setIsSummaryOpen(false);
          setIsCartOpen(true);
        }}
        onSelectProduct={handleSelectProduct}
      />

      {/* Product Detail Quick-View Modal */}
      <ProductModal
        productId={activeProductId}
        onClose={handleCloseProductModal}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}