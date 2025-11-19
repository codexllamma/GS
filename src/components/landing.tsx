"use client";

import AnimatedLogo from "@/components/animatedLogo";
import Logo from "@/components/logo";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useAuthModal } from "@/store/useAuthModal";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { open } = useAuthModal();
  const [lookbookImages, setLookbookImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  // Auto-rotate image every 4s
  useEffect(() => {
    if (lookbookImages.length === 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % lookbookImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [lookbookImages]);

  // Fetch lookbook images (primary images from products)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/product");
        const data = await res.json();

        const imgs = data
          .flatMap((p: any) => p.images)
          .filter((img: any) => img?.url)
          .map((img: any) => img.url);

        setLookbookImages(imgs);
      } catch (err) {
        console.error("Failed to load hero images", err);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">

      {/* HEADER */}
      <header className="max-w-7xl mx-auto py-4 flex items-center justify-center">
        <AnimatedLogo />
      </header>

      {/* HERO: FADE-IN LOOKBOOK */}
      <section className="relative w-full h-[100vh] overflow-hidden bg-black">

        {/* Background Image */}
        <AnimatePresence mode="wait">
  {lookbookImages.length > 0 && (
    <motion.div
      key={lookbookImages[index]}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
      className="absolute inset-0"
    >
      <Image
        src={lookbookImages[index]}
        alt="Lookbook"
        fill
        className="object-cover opacity-40"
        priority
      />
    </motion.div>
  )}
</AnimatePresence>


        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-6xl md:text-8xl font-light tracking-tight">
            <Logo />
          </h1>
        </div>

        {/* CTA bottom-right */}
        <div className="absolute bottom-10 right-10">
          <Link href="/product/products">
            <button className="group flex items-center gap-2 text-white/90 text-lg font-light">
              <span className="group-hover:text-white transition-colors">
                Explore Collection
              </span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* BRAND BLOCK */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-2xl md:text-3xl leading-relaxed font-light">
            To wear <span className="font-normal text-black">ĦIÈR</span> is to wear{" "}
            <span className="text-black font-normal">heritage</span>—
          </p>
          <p className="text-2xl md:text-3xl leading-relaxed font-light mt-4">
            a signature of <span className="text-black font-normal">discretion</span>,
          </p>
          <p className="text-2xl md:text-3xl leading-relaxed font-light mt-4">
            a silent emblem of belonging to the few who{" "}
            <span className="text-black font-normal">truly know</span>.
          </p>
        </div>

        {/* FEATURE CARDS */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">

          {/* Card 1 */}
          <Link href="/product/products" className="group block">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-normal mb-3">Explore Collection</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Discover our curated selection of timeless pieces.
              </p>
              <span className="flex items-center gap-2 text-black font-light group-hover:gap-3 transition-all">
                View Collection <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/legal/about" className="group block">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <span className="text-white font-bold text-xl">Ġ</span>
              </div>
              <h3 className="text-xl font-normal mb-3">Learn More</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Understand the craftsmanship behind every garment.
              </p>
              <span className="flex items-center gap-2 text-black font-light group-hover:gap-3 transition-all">
                Our Story <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Card 3 */}
          <button
            onClick={() => {
              localStorage.setItem("redirectIntent", "/dashboard");
              open();
            }}
            className="group text-left"
          >
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-normal mb-3">Join Now</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Become part of an exclusive circle — early access & events.
              </p>
              <span className="flex items-center gap-2 text-black font-light group-hover:gap-3 transition-all">
                Join Circle <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
