"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const getSafeUrl = (url: string) => {
  if (!url) return "";
  return url.replace(/ /g, "%20");
};

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    images: { url: string; isPrimary: boolean }[];
    category?: string;
    stock?: number;
    createdAt?: string;
  };
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  
  const hasPrefetched = useRef(false);
  const images = product.images || [];

  const handleMouseEnter = () => {
    if (!hasPrefetched.current && images.length > 1) {
      images.forEach((img, idx) => {
        if (idx === 0) return;
        const imgObj = new window.Image();
        imgObj.src = getSafeUrl(img.url);
      });
      hasPrefetched.current = true;
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(1);
    setCurrentImage((prev) => (prev + 1) % images.length);
    setImgSrc(null);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(-1);
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    setImgSrc(null);
  };

  // Triggers shallow URL push to open ProductModal on the single page
  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(
      { query: { ...router.query, product: product.id } },
      undefined,
      { shallow: true }
    );
  };

  const activeUrl = imgSrc || getSafeUrl(images[currentImage]?.url);
  const finalUrl = activeUrl || "https://placehold.co/600x800/png?text=No+Image";

  return (
    <div 
      onClick={handleOpenQuickView}
      onMouseEnter={handleMouseEnter} 
      className="group relative flex flex-col cursor-pointer transition-transform duration-500 hover:scale-[1.005]"
    >
      <div
        className="relative block w-full aspect-[3/5] sm:aspect-[4/5] md:aspect-[10/12]
          overflow-hidden bg-neutral-100 border border-neutral-200"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, x: direction === 1 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 1 ? -20 : 20 }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src={finalUrl}
              alt={product.name}
              fill
              unoptimized={true} 
              priority={priority} 
              className="object-cover transition-all duration-700 group-hover:scale-[1.02] group-hover:brightness-[1.05]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => {
                setImgSrc("https://placehold.co/600x800/png?text=Image+Error");
              }}
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-black opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white transition-all rounded-sm z-10"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-black opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white transition-all rounded-sm z-10"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col mt-3 px-1 select-none">
        <h3 className="font-apercu text-[1.05rem] font-medium tracking-tight line-clamp-1 group-hover:text-black transition-colors duration-200">
          {product.name}
        </h3>
        <div className="font-apercu flex items-center justify-between mt-1">
          <p className="text-[14px] text-gray-700">₹{product.basePrice}</p>
          <button
            onClick={handleOpenQuickView}
            className="flex items-center justify-center gap-1 border border-black text-black text-[13px] px-3 py-1 hover:bg-black hover:text-white transition-all duration-300"
          >
            <ShoppingBag size={13} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}