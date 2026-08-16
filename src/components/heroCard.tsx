"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";

const getSafeUrl = (url: string) => {
  if (!url) return "";
  return url.replace(/ /g, "%20");
};

interface HeroCardProps {
  product: {
    id: string;
    name: string;
    basePrice: number;
    images: { url: string; isPrimary: boolean }[];
  };
  priority?: boolean;
}

export default function HeroCard({ product, priority = true }: HeroCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasPrefetched = useRef(false);
  
  const images = product.images || [];
  const x = useMotionValue(0);

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

  const slideToIndex = (index: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    setCurrentImage(index);
    animate(x, -index * width, {
      type: "spring",
      stiffness: 350,
      damping: 35,
      mass: 0.5,
    });
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images.length <= 1) return;
    const nextIndex = (currentImage + 1) % images.length;
    slideToIndex(nextIndex);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images.length <= 1) return;
    const prevIndex = (currentImage - 1 + images.length) % images.length;
    slideToIndex(prevIndex);
  };

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 50);

    if (images.length <= 1 || !containerRef.current) return;

    const width = containerRef.current.offsetWidth;
    const swipeThreshold = width * 0.2;
    const velocityThreshold = 300;

    let targetIndex = currentImage;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      targetIndex = Math.min(currentImage + 1, images.length - 1);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      targetIndex = Math.max(currentImage - 1, 0);
    }

    slideToIndex(targetIndex);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging.current) return;
    e.preventDefault();
    router.push(
      { query: { ...router.query, product: product.id } },
      undefined,
      { shallow: true }
    );
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      className="
        group relative block 
        w-full h-full
        aspect-[4/5] sm:aspect-[5/6] md:aspect-auto 
        overflow-hidden 
        rounded-sm
        border border-brand-border 
        bg-brand-card 
        cursor-pointer
        select-none
        touch-pan-y
      "
    >
      {/* Motion Track */}
      {images.length > 0 ? (
        <motion.div
          className="flex h-full w-full cursor-grab active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragDirectionLock
          dragConstraints={{
            left: -((images.length - 1) * (containerRef.current?.offsetWidth || 0)),
            right: 0,
          }}
          dragElastic={0.12}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {images.map((img, idx) => {
            const url = getSafeUrl(img.url) || "https://placehold.co/800x1000/png?text=No+Image";
            return (
              <div key={idx} className="relative h-full w-full flex-shrink-0 min-w-full">
                <Image
                  src={url}
                  alt={product.name}
                  fill
                  unoptimized={true}
                  priority={priority && idx === 0}
                  className="object-cover object-top pointer-events-none transition-transform duration-700 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            );
          })}
        </motion.div>
      ) : (
        <div className="relative h-full w-full">
          <Image
            src="https://placehold.co/800x1000/png?text=No+Image"
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Luxury Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

      {/* Bottom Information Layer */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex items-end justify-between gap-3 z-10">
        <div className="flex flex-col max-w-[65%]">
          <h2 className="font-serif text-base sm:text-xl font-medium text-white tracking-wider uppercase leading-tight line-clamp-1 drop-shadow-sm">
            {product.name}
          </h2>
          <p className="font-sans text-[13px] sm:text-[15px] font-medium text-brand-lightText/90 mt-1">
            ₹{product.basePrice.toLocaleString("en-IN")}
          </p>
        </div>

        <button
          onClick={handleCardClick}
          className="
            flex items-center justify-center gap-1.5 
            bg-brand-btn text-white 
            text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase 
            px-4 py-2 sm:py-2.5 rounded-sm 
            hover:opacity-90 active:scale-95 
            transition-all shadow-md 
            cursor-pointer whitespace-nowrap
          "
        >
          <ShoppingBag size={13} className="stroke-[2]" />
          <span>ADD</span>
        </button>
      </div>

      {/* Desktop Arrow Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="
              hidden md:flex 
              absolute left-3 top-1/2 -translate-y-1/2 
              bg-white/85 text-brand-charcoal hover:bg-white 
              p-2 rounded-full opacity-0 
              group-hover:opacity-100 
              transition-all shadow-md z-10 cursor-pointer
            "
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="
              hidden md:flex 
              absolute right-3 top-1/2 -translate-y-1/2 
              bg-white/85 text-brand-charcoal hover:bg-white 
              p-2 rounded-full opacity-0 
              group-hover:opacity-100 
              transition-all shadow-md z-10 cursor-pointer
            "
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>

          {/* Brand Green Dots Indicator */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5 pointer-events-none z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentImage === i
                    ? "w-3.5 bg-brand-btn shadow-sm"
                    : "w-1.5 bg-brand-btn/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}