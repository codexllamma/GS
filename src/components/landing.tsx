"use client";

import AnimatedLogo from "@/components/animatedLogo";
import Logo from "@/components/logo";
import { ArrowRight, ShirtIcon, Users } from "lucide-react";
import Link from "next/link";
import { useAuthModal } from "@/store/useAuthModal";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

// --- HELPER: Preload Logic ---
const preloadImage = (url: string) => {
  return new Promise((resolve) => {
    if (!url) { resolve(true); return; }
    const img = new window.Image();
    img.src = url;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(true);
  });
};

export default function LandingPage() {
  const { open } = useAuthModal();
  
  // Data State
  const [lookbookImages, setLookbookImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  
  // Loading & UI State
  const [isMobile, setIsMobile] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false); 

  // 1. Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Fetch & Adaptive Load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/hero");
        if (!res.ok) throw new Error("API Error");
        
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
           if (!isMobile) {
             await preloadImage(data[0]);
           }
           setLookbookImages(data);
        }
      } catch (err) {
        console.error("Hero Load Error:", err);
      }
    })();
  }, [isMobile]);

  // 3. Auto-Rotate Logic
  useEffect(() => {
    if (lookbookImages.length <= 1) return;

    const interval = setInterval(() => {
      setIsImageReady(false);
      setIndex((prev) => (prev + 1) % lookbookImages.length);
    }, 5000); 

    return () => clearInterval(interval);
  }, [lookbookImages]);

  // Fallback
  const activeImage = lookbookImages.length > 0 ? lookbookImages[index] : null;

  return (
    <div className="min-h-screen bg-white text-black font-apercu">

      {/* HEADER */}
      <header className="max-w-7xl mx-auto py-4 flex items-center justify-center relative z-50">
        <AnimatedLogo />
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full h-[100vh] overflow-hidden bg-black">

        {/* BACKGROUND CAROUSEL */}
        <AnimatePresence mode="wait">
          {activeImage && (
            <motion.div
              key={activeImage} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage}
                alt="Lookbook"
                fill
                // THE FIX IS HERE: Added 'object-top' to prioritize the top of the image
                className={`object-cover object-center transition-opacity duration-1000 ease-out ${
                  isImageReady ? "opacity-60" : "opacity-0"
                }`}
                priority={true}
                unoptimized={true} 
                onLoad={() => setIsImageReady(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-white text-6xl md:text-8xl font-light tracking-tight drop-shadow-2xl">
            <Logo />
          </div>
        </div>

        {/* CTA bottom-right */}
        <div className="absolute bottom-10 right-10 z-30">
          <Link href="/product/products">
            <button className="group flex items-center gap-2 text-white/90 text-lg font-light hover:text-white transition-colors">
              <span>Explore Collection</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* BRAND BLOCK */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-2xl md:text-3xl leading-relaxed font-light">
            To wear <span className="font-semibold text-black">ĦIÈR</span> is to wear{" "}
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
          <Link href="/product/products" className="group block h-full">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg h-full flex flex-col items-start">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <ShirtIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-normal mb-3">Explore Collection</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Discover our curated selection of timeless pieces.
              </p>
              <span className="flex items-center gap-2 text-black font-light group-hover:gap-3 transition-all mt-auto">
                View Collection <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/legal/learn" className="group block h-full">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg h-full flex flex-col items-start">
              <div className="relative flex items-center text-white justify-center w-12 h-12 bg-black mb-6 rounded-sm overflow-hidden">
                <Image 
                  src={"/logo_white.svg"}
                  alt='Logo'
                  height={46}
                  width={46}
                  className="absolute top-2.5 left-1 opacity-90"
                />
              </div>
              <h3 className="text-xl font-normal mb-3">Learn More</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Understand the craftsmanship behind every garment.
              </p>
              <span className="flex items-center gap-2 text-black font-light group-hover:gap-3 transition-all mt-auto">
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
            className="group text-left h-full w-full"
          >
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg h-full flex flex-col items-start">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-normal mb-3">Join Now</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Become part of an exclusive circle — early access & events.
              </p>
              <span className="flex items-center gap-2 text-black font-light group-hover:gap-3 transition-all mt-auto">
                Join Circle <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}