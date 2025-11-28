"use client";

import Image, { ImageProps } from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

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

// --- NEW COMPONENT: ANTI-PIXELATION IMAGE WRAPPER ---
// This handles the "opacity-0 -> opacity-100" logic for every individual image
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
      {/* Optional: Tiny spinner while the image decodes */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/10">
           <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const Hero = () => {
  // Products for Grid & Bottom Carousel
  const [products, setProducts] = useState<Product[]>([]);
  // Hero Images for Top Section Background
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 1. Detect Device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    (async () => {
      try {
        // A. Fetch Products (For Grid & Bottom Carousel)
        const productRes = await fetch("/api/product"); 
        const productData = await productRes.json();
        
        const mappedProducts = Array.isArray(productData) ? productData.map((p: any) => ({
          ...p,
          createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
          images: p.images ?? [],
        })) : [];

        // B. Fetch Hero Images (For Top Section Background)
        const heroRes = await fetch("/api/hero");
        const heroData = await heroRes.json();
        const validHeroImages = Array.isArray(heroData) ? heroData : [];

        // ADAPTIVE PRELOAD (Desktop only)
        if (!isMobile) {
          const prodUrls = mappedProducts.slice(0, 3).map((p: Product) => p.images?.[0]?.url).filter(Boolean);
          const heroUrls = validHeroImages.slice(0, 2);
          await Promise.all([...prodUrls, ...heroUrls].map((url: string) => preloadImage(url)));
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

  // 3. Auto-Rotate Top Hero Image
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
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 font-apercu">

      {/* --- TOP SECTION: HERO IMAGE BACKGROUND + TEXT OVERLAY --- */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        
        {/* Background Slideshow */}
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
              {/* Using SmoothImage for Anti-Pixelation on Background */}
              <SmoothImage
                src={getSafeUrl(activeHeroImage)}
                alt="Atmosphere"
                fill
                className="object-cover" // We control opacity in the wrapper
                priority={true}
                unoptimized={true}
              />
              {/* Extra Dark Overlay for Text Readability */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient Overlay for Text Pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 z-10 pointer-events-none" />

        {/* Text Content */}
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

      {/* --- FEATURED PRODUCTS GRID --- */}
      <section className="mt-20 px-4 md:px-20">
        <h2 className="text-3xl font-bold text-black mb-10 text-center tracking-tight">
          Featured Styles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProducts.map((product) => {
            const rawUrl = product.images?.[0]?.url;
            const safeUrl = getSafeUrl(rawUrl) || "https://placehold.co/600x800/png?text=No+Image";

            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                className="group flex flex-col backdrop-blur-lg bg-white/70 border border-white/40 rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
                  <Link href={`/product/${product.id}`}>
                    {/* USING SMOOTH IMAGE */}
                    <SmoothImage
                      src={safeUrl}
                      alt={product.name}
                      fill
                      unoptimized={true}
                      priority={!isMobile}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Link>
                </div>

                <div className="p-5 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-black line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-black font-medium">
                      ₹{product.basePrice}
                    </p>
                  </div>
                  <Link href={`/product/${product.id}`} className="mt-2">
                    <button className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                      View Product
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* --- LOOKBOOK CAROUSEL (USING PRODUCT IMAGES) --- */}
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
            {/* Duplicated for loop */}
            {[...products, ...products].map((product, index) => {
              const rawUrl = product.images?.[0]?.url;
              if (!rawUrl) return null;
              const safeUrl = getSafeUrl(rawUrl);

              return (
                <div key={`${product.id}-lookbook-${index}`} className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px] flex-shrink-0 rounded-2xl overflow-hidden shadow-md bg-gray-100">
                   {/* USING SMOOTH IMAGE */}
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