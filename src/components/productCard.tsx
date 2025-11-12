"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

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
  isAdded?: boolean;
  onAddToCart?: (id: string) => void;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [direction, setDirection] = useState(1);
  const images = product.images || [];

  const handleNext = () => {
    setDirection(1);
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group relative flex flex-col cursor-pointer transition-transform duration-500 hover:scale-[1.005]">
      {/* Clickable Image */}
      <Link
      href={`/product/${product.id}`}
      className="relative block w-full aspect-[3/5] sm:aspect-[4/5] md:aspect-[10/12]
        overflow-hidden bg-neutral-100 border border-neutral-200 cursor-pointer"
      >

        <AnimatePresence mode="wait">
          <motion.div
            key={images[currentImage]?.url}
            initial={{ opacity: 0, x: direction === 1 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 1 ? 20 : -20 }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              opacity: { duration: 0.3 },
            }}
            className="absolute inset-0"
          >
            <Image
              src={images[currentImage]?.url}
              alt={product.name}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-[1.02] group-hover:brightness-[1.05]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-black opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white transition-all rounded-sm"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-black opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white transition-all rounded-sm"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-col mt-3 px-1 select-none">
        <h3 className="font-apercu text-[1.05rem] font-medium tracking-tight line-clamp-1 group-hover:text-black transition-colors duration-200">
          {product.name}
        </h3>
        <div className="font-apercu flex items-center justify-between mt-1">
          <p className="text-[14px] text-gray-700">₹{product.basePrice}</p>
          <Link
            href={`/product/${product.id}`}
            className="flex items-center justify-center gap-1 border border-black text-black text-[13px] px-3 py-1 hover:bg-black hover:text-white transition-all duration-300"
          >
            <ShoppingBag size={13} />
            <span >Add</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
