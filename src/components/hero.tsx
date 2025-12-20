"use client";

import Image, { ImageProps } from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// --- CONFIGURATION: CATEGORY IMAGES ---
// Replace these placeholders with your actual image URLs later.
const CATEGORIES = [
  { 
    id: "cat_shirts",
    name: "Shirts", 
    image: "https://rzgwffrwwmxtnontocdv.supabase.co/storage/v1/object/public/images/hero/IMG_0393.avif", // <--- PASTE SHIRT URL HERE
    link: "Shirts"
  },
  { 
    id: "cat_trousers",
    name: "Trousers", 
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", // <--- PASTE TROUSER URL HERE
    link: "Trousers"
  },
  { 
    id: "cat_polos",
    name: "Polos", 
    image: "https://rzgwffrwwmxtnontocdv.supabase.co/storage/v1/object/public/images/hero/IMG_0661.avif", // <--- PASTE POLO URL HERE
    link: "Polos"
  }
];

// --- INTERFACES ---
export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: { url: string; isPrimary: boolean }[];
  category?: string;
  stock?: number;
  createdAt?: string;
}

// --- HELPERS ---
const getSafeUrl = (url: string) => {
  if (!url) return "";
  return url.replace(/ /g, "%20");
};

const preloadImage = (url: string) => {
  return new Promise((resolve) => {
    if (!url) { resolve(true); return; }
    const img = new window.Image();
    img.src = getSafeUrl(url);
    img.onload = () => resolve(true);
    img.onerror = () => resolve(true);
  });
};

const SmoothImage = (props: ImageProps) => {
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="relative w-full h-full">
      <Image
        {...props}
        className={`${props.className || ""} transition-opacity duration-700 ease-out ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(e) => {
          setIsReady(true);
          if (props.onLoad) props.onLoad(e);
        }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/10">
           <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const Hero = () => {
  // Products for Lookbook only now
  const [products, setProducts] = useState<Product[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // A. Fetch Products (Used for Lookbook Carousel)
        const productRes = await fetch("/api/product"); 
        const productData = await productRes.json();
        
        const mappedProducts = Array.isArray(productData) ? productData.map((p: any) => ({
          ...p,
          createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
          images: p.images ?? [],
        })) : [];

        // B. Fetch Hero Images (For Top Background)
        const heroRes = await fetch("/api/hero");
        const heroData = await heroRes.json();
        const validHeroImages = Array.isArray(heroData) ? heroData : [];

        // Preload Logic
        if (!isMobile) {
          // Preload Hero BG
          const heroUrls = validHeroImages.slice(0, 2);
          // Preload Category Images
          const catUrls = CATEGORIES.map(c => c.image);
          await Promise.all([...heroUrls, ...catUrls].map((url) => preloadImage(url)));
        }

        setProducts(mappedProducts);
        setHeroImages(validHeroImages);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isMobile]);

  // Auto-Rotate Top Hero Image
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const activeHeroImage = heroImages.length > 0 ? heroImages[heroIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 font-apercu">

      {/* --- TOP SECTION: BANNER --- */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {activeHeroImage && (
            <motion.div
              key={activeHeroImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <SmoothImage
                src={getSafeUrl(activeHeroImage)}
                alt="Atmosphere"
                fill
                className="object-cover"
                priority={true}
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 z-10 pointer-events-none" />

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-4xl md:text-7xl font-sans text-white tracking-tight font-bold drop-shadow-xl leading-tight">
              Step into a world of <br/> unmatched quality
            </p>
            <p className="mt-6 text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
              Your one-stop destination for timeless clothing.
            </p>

            <Link href="/product/products">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-10 bg-white text-black px-10 py-4 rounded-full shadow-2xl font-medium hover:bg-gray-100 transition-colors text-lg"
              >
                Explore Collection
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- REPLACED: SHOP BY CATEGORY (Instead of Products) --- */}
      <section className="mt-16 px-4 md:px-20">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center tracking-tight">
          Shop by Category
        </h2>

        {/* MOBILE UX FIX:
            - 'grid-cols-2': Allows side-by-side items on mobile.
            - First item gets 'col-span-2' to be the "Hero Category".
            - Next two items fit side-by-side.
            - RESULT: All 3 categories fit in one glance.
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
          {CATEGORIES.map((cat, index) => (
            <Link 
              key={cat.id} 
              href={`/product/products?category=${cat.link}`}
              className={`
                group relative overflow-hidden rounded-xl bg-neutral-100 shadow-sm 
                ${index === 0 ? 'col-span-2 md:col-span-1' : 'col-span-1'}
                aspect-[4/3] md:aspect-[3/4]
              `}
            >
              {/* Image with Subtle Zoom */}
              <SmoothImage
                src={cat.image}
                alt={cat.name}
                fill
                unoptimized={true}
                priority={!isMobile} // Only prioritize the main ones
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />

              {/* Elegant Dark Overlay 
                  - Default: slightly dark (to make white text readable)
                  - Hover: darker (focus effect)
              */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-1800" />

              {/* Centered Title (No Buttons) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <h3 className="text-white text-2xl md:text-4xl font-bold tracking-widest uppercase drop-shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-1800">
                  {cat.name}
                </h3>
                
                {/* Subtle "Shop" text that appears on hover (Desktop) or stays visible (Mobile) */}
                <div className="overflow-hidden h-0 group-hover:h-auto md:h-0 transition-all duration-1800">
                   <span className="text-white/90 text-xs md:text-sm font-medium tracking-widest border-b border-white/50 pb-0.5 mt-2 inline-block">
                     EXPLORE
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- LOOKBOOK CAROUSEL --- */}
      <section className="mt-24 mb-20 px-0 md:px-20 overflow-hidden">
        <h2 className="text-3xl font-bold text-black mb-10 text-center tracking-tight">
          Lookbook
        </h2>

        <div className="relative w-full">
           <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-blue-50/90 to-transparent z-10 pointer-events-none" />
           <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-blue-50/90 to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {[...products, ...products].map((product, index) => {
              const rawUrl = product.images?.[0]?.url;
              if (!rawUrl) return null;
              const safeUrl = getSafeUrl(rawUrl);

              return (
                <div key={`${product.id}-lookbook-${index}`} className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px] flex-shrink-0 rounded-2xl overflow-hidden shadow-md bg-gray-100">
                   <SmoothImage
                    src={safeUrl}
                    alt="Lookbook"
                    fill
                    unoptimized={true}
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Hero;