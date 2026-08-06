"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/header";
import Hero from "@/components/hero";
import ProductsGrid from "@/components/productGrid";
import { CartSheet } from "@/components/cartSheet";
import { CartStickyBar } from "@/components/cartStickyBar";
import { ProductModal } from "@/components/productModal";

export default function Home() {
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Read `?product=id` from URL query string
  const activeProductId = typeof router.query.product === "string" ? router.query.product : null;

  const handleCloseProductModal = () => {
    const { product, ...restQuery } = router.query;
    router.push({ query: restQuery }, undefined, { shallow: true });
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-apercu text-neutral-900 selection:bg-black selection:text-white">
      {/* Header Bar */}
      <Header />

      {/* Main Hero & Shop Categories */}
      {/*<Hero />*/}

      {/* Dynamic Products Grid with Infinite Scroll */}
      <div id="catalog" className="pt-6">
        <ProductsGrid />
      </div>

      {/* Floating Bottom Cart CTA Bar */}
      <CartStickyBar onOpenCart={() => setIsCartOpen(true)} />

      {/* 75% Mobile Height Bottom Sheet Cart */}
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Product Detail Quick-View Modal */}
      <ProductModal
        productId={activeProductId}
        onClose={handleCloseProductModal}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}