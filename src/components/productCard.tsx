"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";

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
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      className="group relative flex flex-col cursor-pointer transition-all duration-300 select-none"
    >
      {/* Continuous Spring Carousel Box */}
      <div
        ref={containerRef}
        className="relative block w-full aspect-[3/4] overflow-hidden rounded-sm bg-brand-card border border-brand-border touch-pan-y"
      >
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
              const url = getSafeUrl(img.url) || "https://placehold.co/600x800/png?text=No+Image";
              return (
                <div key={idx} className="relative h-full w-full flex-shrink-0 min-w-full">
                  <Image
                    src={url}
                    alt={product.name}
                    fill
                    unoptimized={true}
                    priority={priority && idx === 0}
                    className="object-cover object-top pointer-events-none transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              );
            })}
          </motion.div>
        ) : (
          <div className="relative h-full w-full">
            <Image
              src="https://placehold.co/600x800/png?text=No+Image"
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Desktop Arrow Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 text-brand-charcoal opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white transition-all rounded-full z-10 shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 text-brand-charcoal opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white transition-all rounded-full z-10 shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight size={14} />
            </button>

            {/* Brand Green Dots */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center space-x-1.5 pointer-events-none z-10">
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

      {/* Card Details */}
      <div className="flex flex-col mt-2.5 px-0.5">
        <h3 className="font-serif text-[12px] sm:text-[13px] font-medium tracking-wider uppercase text-brand-charcoal line-clamp-1 group-hover:text-brand-olive transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <p className="text-[13px] font-medium text-brand-charcoal">
            ₹{product.basePrice.toLocaleString("en-IN")}
          </p>

          <button
            onClick={handleCardClick}
            className="flex items-center justify-center gap-1 bg-brand-btn text-white text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <ShoppingBag size={12} className="stroke-[2]" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}