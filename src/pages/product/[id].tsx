"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { ShoppingBag, ChevronLeft, ChevronRight, Star } from "lucide-react";
import prisma from "@/lib/prisma";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/header";
import Link from "next/link";

// --- INTERFACES ---
interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  id: string;
  size: string;
  price: number;
  stock: number;
}

interface Fabric {
  name: string;
  category: { name: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  color: string;
  fabric: Fabric;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

// --- HELPER: Fix Supabase URLs ---
const getSafeUrl = (url: string) => {
  if (!url) return "";
  return url.replace(/ /g, "%20");
};

// --- HELPER: Preload Image (Promise Barrier) ---
const preloadImage = (url: string) => {
  return new Promise((resolve) => {
    if (!url) { resolve(true); return; }
    const img = new window.Image();
    img.src = getSafeUrl(url);
    img.onload = () => resolve(true);
    img.onerror = () => resolve(true);
  });
};

// --- SERVER SIDE PROPS ---
export const getServerSideProps: GetServerSideProps<{ product: Product | null }> = async (
  context: GetServerSidePropsContext
) => {
  const { params } = context;
  const id = params?.id as string;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        fabric: { include: { category: true } },
        variants: true,
        images: true,
      },
    });

    if (!product) return { notFound: true };

    return {
      props: { product: JSON.parse(JSON.stringify(product)) },
    };
  } catch (error) {
    console.error("Product fetch error:", error);
    return { notFound: true };
  }
};

// --- COMPONENT ---
export default function ProductDetailsPage({ product }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [added, setAdded] = useState(false);
  
  // --- LOADING STATES ---
  const [isLoading, setIsLoading] = useState(true); 
  const [isMobile, setIsMobile] = useState(false);
  
  // --- IMAGE FADE STATE ---
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
    const initPage = async () => {
      if (!product) {
        setIsLoading(false);
        return;
      }

      // Initialize Size
      if (product.variants?.length > 0) {
         const firstInStock = product.variants.find((v) => v.stock > 0);
         if (firstInStock) setSelectedSize(firstInStock.size);
      }

      // ADAPTIVE LOADING: Wait for image on Desktop only
      if (!isMobile) {
        const mainUrl = product.images?.[0]?.url;
        if (mainUrl) {
          await preloadImage(mainUrl);
        }
      }
      
      setIsLoading(false);
    };

    initPage();
  }, [product, isMobile]);

  // --- IMAGES ---
  const images = product?.images ?? [];
  const mainImgUrl = getSafeUrl(images[currentImage]?.url) || "https://placehold.co/600x800/png?text=No+Image";

  const handleNextImage = () => {
    setIsImageReady(false); 
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setIsImageReady(false); 
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleThumbnailClick = (idx: number) => {
    if (idx === currentImage) return;
    setIsImageReady(false);
    setCurrentImage(idx);
  };

  // --- ADD TO CART ---
  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert("Please choose a size");
      return;
    }

    try {
      const variant = product?.variants.find((v) => v.size === selectedSize);
      if (!variant) throw new Error("Variant not found");

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to add to cart");
      }

      setAdded(true);
    } catch (error: any) {
      console.error("Add to cart error:", error);
      alert(error.message || "Could not add item to cart.");
    }
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const currentVariant = product.variants.find(v => v.size === selectedSize);
  const isCurrentSelectionOutOfStock = currentVariant ? currentVariant.stock <= 0 : false;

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 font-apercu text-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            
            {/* --- LEFT: IMAGE GALLERY --- */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4"
            >
              {/* Main Image Viewport */}
              <div className="relative w-full h-[70vh] md:h-[85vh] bg-neutral-50/50 rounded-none overflow-hidden shadow-sm border border-white/50 group flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <Image
                      src={mainImgUrl}
                      alt={product.name}
                      width={2400} 
                      height={3200}
                      unoptimized={true} 
                      priority={true}
                      className={`w-full h-full object-contain transition-opacity duration-700 ease-out ${
                        isImageReady ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setIsImageReady(true)}
                    />
                    
                    {!isImageReady && (
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                       </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white shadow-md">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white shadow-md">
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails - NOW CENTER ALIGNED */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleThumbnailClick(idx)}
                      className={`relative w-20 h-24 flex-shrink-0 border-2 transition-all ${
                        currentImage === idx ? "border-black" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={getSafeUrl(img.url)}
                        alt={`Thumbnail ${idx}`}
                        fill
                        unoptimized={true}
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* --- RIGHT: PRODUCT DETAILS --- */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="flex flex-col h-full"
            >
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                {product.fabric?.category?.name || "Collection"}
              </span>

              <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-4">
                {product.name}
              </h1>

              <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
                <span className="text-2xl font-medium text-black">
                  ₹{product.basePrice.toLocaleString()}
                </span>
                
              </div>

              {/* Size Selector */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-black">Select Size</span>
                  <button className="text-xs underline text-gray-500 hover:text-black">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.variants?.map((v) => {
                    const isOutOfStock = v.stock <= 0;
                    const isSelected = selectedSize === v.size;
                    return (
                      <button
                        key={v.size}
                        disabled={isOutOfStock}
                        onClick={() => {
                          if (!isOutOfStock) {
                             setSelectedSize(v.size);
                             setAdded(false); 
                          }
                        }}
                        className={`
                          min-w-[50px] h-[50px] px-4 rounded-sm flex items-center justify-center border text-sm font-medium transition-all
                          ${isOutOfStock 
                             ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed decoration-slice line-through" 
                             : isSelected 
                               ? "bg-black text-white border-black shadow-md" 
                               : "bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50"
                          }
                        `}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
                {!selectedSize && <p className="text-red-500 text-xs mt-2">Please select a size</p>}
              </div>

              {/* Add to Cart Button */}
              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || isCurrentSelectionOutOfStock}
                  className={`
                    group relative w-full h-[56px] overflow-hidden rounded-none font-semibold uppercase tracking-wider text-sm transition-all duration-300
                    ${(!selectedSize || isCurrentSelectionOutOfStock)
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white hover:bg-neutral-800"
                    }
                  `}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {added ? (
                      <motion.div
                        key="added"
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 flex items-center justify-center gap-2 w-full h-full"
                      >
                        <span>Size {selectedSize} added ✓ — <Link href="/checkout" className="underline hover:text-gray-200">Checkout</Link></span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="default"
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 flex items-center justify-center gap-2 w-full h-full"
                      >
                        <ShoppingBag size={18} />
                        <span>{isCurrentSelectionOutOfStock ? "Out of Stock" : "Add to Bag"}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              <div className="mb-10 bg-blue-50/50 p-4 rounded-sm border border-blue-100 text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  By making this payment, you agree to our{' '}
                  <Link href="/terms" className="underline text-gray-800 hover:text-black">Terms of Conditions</Link> 
                  {' '}and{' '}
                  <Link href="/privacy" className="underline text-gray-800 hover:text-black">Privacy Policy</Link>.
                  <br/>
                  HIÈR™ ensures secure processing of all transactions.
                </p>
              </div>

              <div className="mt-auto">
                <h3 className="font-bold text-lg mb-3 border-t border-gray-200 pt-6">
                  Description
                </h3>
                <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                  {product.description}
                </div>
                
                <div className="mt-8 bg-white rounded-sm border border-gray-100 p-5 shadow-sm space-y-3">
                   <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="font-semibold text-black">Fabric</span>
                      <span className="text-gray-600">{product.fabric?.name || "Premium Cotton"}</span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="font-semibold text-black">Color</span>
                      <span className="text-gray-600 capitalize">{product.color || "Standard"}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="font-semibold text-black">Delivery</span>
                      <span className="text-gray-600">Dispatched within 24 hours</span>
                   </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}