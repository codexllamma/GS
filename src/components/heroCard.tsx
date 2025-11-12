"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface HeroCardProps {
  product: {
    id: string;
    name: string;
    basePrice: number;
    images: { url: string; isPrimary: boolean }[];
  };
}

export default function HeroCard({ product }: HeroCardProps) {
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
    <Link
      href={`/product/${product.id}`}
      className="
        group relative block 
        w-full 
        aspect-[4/5] sm:aspect-[5/6] md:aspect-[3/4] 
        overflow-hidden 
        border border-neutral-300 
        bg-neutral-100 
        cursor-pointer
      "
    >
      {/* Image Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={images[currentImage]?.url}
          initial={{ opacity: 0, x: direction === 1 ? 25 : -25 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 1 ? 25 : -25 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[currentImage]?.url}
            alt={product.name}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-[1.03] group-hover:brightness-[1.05]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-50 transition-all duration-300" />

      {/* Text Layer */}
      <div
        className="
          absolute bottom-6 left-6 right-6
          text-white 
          max-w-[90%] 
          flex flex-col gap-1
        "
      >
        <h2 className="font-apercu text-xl md:text-2xl font-semibold leading-tight group-hover:text-amber-300 transition-colors">
          {product.name}
        </h2>
        <p className="text-sm md:text-base text-gray-200 mb-2">
          ₹{product.basePrice}
        </p>
        <div
          className="
            inline-flex items-center gap-2 border border-white px-4 py-1.5 
            text-sm md:text-[15px] 
            group-hover:bg-white group-hover:text-black 
            transition-all duration-300
          "
        >
          Explore <ArrowRight size={14} />
        </div>
      </div>

      {/* Carousel Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrev();
            }}
            className="
              absolute left-3 top-1/2 -translate-y-1/2 
              text-white/80 hover:text-white 
              bg-black/20 hover:bg-black/30 
              p-1.5 rounded-sm opacity-0 
              group-hover:opacity-100 
              transition-all
            "
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
            className="
              absolute right-3 top-1/2 -translate-y-1/2 
              text-white/80 hover:text-white 
              bg-black/20 hover:bg-black/30 
              p-1.5 rounded-sm opacity-0 
              group-hover:opacity-100 
              transition-all
            "
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </Link>
  );
}
