"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  X,
  Plus,
  Minus,
  Truck,
  Sparkles,
  Shirt,
  ShieldCheck,
  Smile,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/useCartStore";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  id: string;
  size: string;
  price: number | null;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  color: string;
  fabric?: { name: string; category?: { name: string } };
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductModalProps {
  productId: string | null;
  onClose: () => void;
  onOpenCart: () => void;
}

const getSafeUrl = (url?: string) => (url ? url.replace(/ /g, "%20") : "");

export const ProductModal: React.FC<ProductModalProps> = ({
  productId,
  onClose,
  onOpenCart,
}) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  // Swipe gesture refs and motion value
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const x = useMotionValue(0);

  // Refs for scrolling
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  const careSectionRef = useRef<HTMLDivElement>(null);
  const returnsSectionRef = useRef<HTMLDivElement>(null);

  // Accordion open state: 'details' is open by default
  const [openSection, setOpenSection] = useState<"details" | "care" | "returns" | null>("details");

  const slideToIndex = (index: number) => {
    if (!imageContainerRef.current) return;
    const width = imageContainerRef.current.offsetWidth;
    setCurrentImage(index);
    // This creates the smooth swipe animation when clicking a thumbnail
    animate(x, -index * width, {
      type: "spring",
      stiffness: 350,
      damping: 35,
      mass: 0.5,
    });
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentImage > 0) slideToIndex(currentImage - 1);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const imagesCount = product?.images?.length ?? 0;
    if (currentImage < imagesCount - 1) slideToIndex(currentImage + 1);
  };

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (
    _: any,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 50);

    const imagesCount = product?.images?.length ?? 0;
    if (imagesCount <= 1 || !imageContainerRef.current) return;

    const width = imageContainerRef.current.offsetWidth;
    const swipeThreshold = width * 0.2;
    const velocityThreshold = 300;

    let targetIndex = currentImage;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      targetIndex = Math.min(currentImage + 1, imagesCount - 1);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      targetIndex = Math.max(currentImage - 1, 0);
    }

    slideToIndex(targetIndex);
  };

  const toggleSection = (section: "details" | "care" | "returns") => {
    setOpenSection((prev) => {
      const isOpening = prev !== section;
      if (isOpening) {
        setTimeout(() => {
          const targetRef =
            section === "details"
              ? detailsSectionRef
              : section === "care"
              ? careSectionRef
              : returnsSectionRef;

          targetRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 180);
      }
      return isOpening ? section : null;
    });
  };

  // Zustand Store Actions
  const addToCart = useCartStore((state) => state.addToCart);
  const buyNow = useCartStore((state) => state.buyNow);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setSelectedVariantId(null);
      setCurrentImage(0);
      x.set(0);
      setOpenSection("details");
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/product/${productId}`);
        if (!res.ok) throw new Error("Product fetch failed");
        const data: Product = await res.json();

        const sortedImages = data.images
          ? [...data.images].sort(
              (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
            )
          : [];

        setProduct({ ...data, images: sortedImages });
        setSelectedVariantId(null);
        setCurrentImage(0);
        x.set(0);
      } catch (err) {

        toast.error("Could not load product details.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Track ViewContent / view_item when product data successfully loads
  useEffect(() => {
    if (!product) return;

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "ViewContent", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.basePrice,
        currency: "INR",
      });
    }

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "view_item", {
        currency: "INR",
        value: product.basePrice,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.basePrice,
          },
        ],
      });
    }
  }, [product]);

  if (!productId) return null;

  const images = product?.images ?? [];
  const currentVariant = product?.variants?.find(
    (v) => v.id === selectedVariantId
  );
  const activePrice =
    currentVariant?.price && currentVariant.price > 0
      ? currentVariant.price
      : product?.basePrice ?? 0;
  const isCurrentOutOfStock = currentVariant ? currentVariant.stock <= 0 : false;

  const scrollToSizeSelector = () => {
    if (sizeSectionRef.current) {
      sizeSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // 1. Standard Add to Bag
  const handleAddToCart = () => {
    if (!selectedVariantId || !currentVariant || !product) {
      toast.error("Please select a size");
      scrollToSizeSelector();
      return;
    }

    if (isCurrentOutOfStock) {
      toast.error("Selected size is out of stock");
      return;
    }

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.basePrice,
        currency: "INR",
      });
    }

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "add_to_cart", {
        currency: "INR",
        value: activePrice,
        buy_type: "standard",
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_variant: currentVariant.size,
            price: activePrice,
            quantity: 1,
          },
        ],
      });
    }

    addToCart({
      variantId: currentVariant.id,
      productId: product.id,
      name: product.name,
      size: currentVariant.size,
      price: activePrice,
      quantity: 1,
      stock: currentVariant.stock,
      image: product.images?.[0]?.url,
      fabric: product.fabric?.name,
      color: product.color,
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price ?? product.basePrice,
        stock: v.stock,
      })),
    });

    toast.success(`Size ${currentVariant.size} added to bag!`);
    onOpenCart();
  };

  // 2. Buy Now Flow
  const handleBuyNow = () => {
    if (!selectedVariantId || !currentVariant || !product) {
      toast.error("Please select a size");
      scrollToSizeSelector();
      return;
    }

    if (isCurrentOutOfStock) {
      toast.error("Selected size is out of stock");
      return;
    }

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.basePrice,
        currency: "INR",
      });
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.basePrice,
        currency: "INR",
        checkout_type: "instant_buy",
      });
    }

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "add_to_cart", {
        currency: "INR",
        value: activePrice,
        buy_type: "instant",
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_variant: currentVariant.size,
            price: activePrice,
            quantity: 1,
          },
        ],
      });
      (window as any).gtag("event", "begin_checkout", {
        currency: "INR",
        value: activePrice,
        checkout_type: "instant_buy",
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_variant: currentVariant.size,
            price: activePrice,
            quantity: 1,
          },
        ],
      });
    }

    buyNow({
      variantId: currentVariant.id,
      productId: product.id,
      name: product.name,
      size: currentVariant.size,
      price: activePrice,
      quantity: 1,
      stock: currentVariant.stock,
      image: product.images?.[0]?.url,
      fabric: product.fabric?.name,
      color: product.color,
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price ?? product.basePrice,
        stock: v.stock,
      })),
    });

    onClose();
    onOpenCart();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 sm:p-5 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "linear" }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-[opacity]"
        />

        {/* Modal Surface */}
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{
            duration: 0.36,
            ease: [0.32, 0.72, 0, 1] as const,
          }}
          className="relative w-full max-w-3xl bg-brand-bg rounded-2xl sm:rounded-md shadow-2xl overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col md:flex-row border border-brand-border transform-gpu will-change-transform"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-30 bg-white/85 hover:bg-white text-brand-charcoal p-2 rounded-full shadow-sm backdrop-blur-sm transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={17} />
          </button>

          {loading || !product ? (
            <div className="w-full h-80 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-brand-border border-t-brand-olive rounded-full animate-spin" />
              <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-textSec">
                Loading Staple...
              </p>
            </div>
          ) : (
            <>
              {/* ---------------- LEFT: SPRING SWIPE CAROUSEL & THUMBNAILS ---------------- */}
              <div className="w-full md:w-[42%] bg-brand-card flex flex-col justify-center p-3.5 sm:p-5 border-b md:border-b-0 md:border-r border-brand-border flex-shrink-0">
                {/* Main Swipeable Stage */}
                <div
                  ref={imageContainerRef}
                  className="relative block w-full max-w-[360px] sm:max-w-[400px] md:max-w-none aspect-[4/5] overflow-hidden rounded-sm bg-brand-stone/30 mx-auto touch-pan-y select-none"
                >
                  {images.length > 0 ? (
                    <motion.div
                      className="flex h-full w-full cursor-grab active:cursor-grabbing"
                      style={{ x }}
                      drag="x"
                      dragDirectionLock
                      dragConstraints={{
                        left: -((images.length - 1) * (imageContainerRef.current?.offsetWidth || 0)),
                        right: 0,
                      }}
                      dragElastic={0.12}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      {images.map((img, idx) => {
                        const url = getSafeUrl(img.url) || "https://placehold.co/600x800/png?text=No+Image";
                        return (
                          <div key={img.id || idx} className="relative h-full w-full flex-shrink-0 min-w-full">
                            <Image
                              src={url}
                              alt={product.name}
                              fill
                              unoptimized={true}
                              draggable={false}
                              className="object-cover object-top pointer-events-none select-none"
                              sizes="(max-width: 768px) 70vw, 40vw"
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
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Dash & Dot Overlay Indicator & Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center space-x-1.5 pointer-events-none z-10">
                        {images.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              currentImage === i
                                ? "w-4 bg-brand-btn shadow-sm"
                                : "w-1.5 bg-brand-btn/30"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Navigation Arrows */}
                      <button
                        onClick={handlePrev}
                        disabled={currentImage === 0}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/50 hover:bg-white/80 backdrop-blur-sm text-brand-charcoal rounded-full opacity-80 hover:opacity-100 transition-all shadow-sm disabled:opacity-0 disabled:pointer-events-none cursor-pointer z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={currentImage === images.length - 1}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/50 hover:bg-white/80 backdrop-blur-sm text-brand-charcoal rounded-full opacity-80 hover:opacity-100 transition-all shadow-sm disabled:opacity-0 disabled:pointer-events-none cursor-pointer z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ---------------- RIGHT: DETAILS & ACTIONS ---------------- */}
              <div className="w-full md:w-[58%] p-4 sm:p-6 overflow-y-auto max-h-[65vh] md:max-h-[90vh] flex flex-col justify-between">
                <div>
                  {/* 1. Product Title */}
                  <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-wide uppercase text-brand-charcoal leading-tight pr-6">
                    {product.name}
                  </h2>

                  <p className="text-[11px] text-brand-textSec mt-1 uppercase tracking-wider">
                    {product.fabric?.name
                      ? `${product.fabric.name} • `
                      : ""}
                    {product.color || "Standard"}
                  </p>

                  {/* 2. Product Price (Right Below Title) */}
                  <div className="mt-2.5 pb-3 border-b border-brand-border/60">
                    <p className="font-sans text-lg sm:text-xl font-semibold text-brand-charcoal">
                      ₹{activePrice.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-brand-textSec block font-light">
                      (Inclusive of all taxes)
                    </span>
                  </div>

                  {/* 3. Size Selector */}
                  <div ref={sizeSectionRef} className="mt-4 pt-1">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-widest block">
                        SELECT SIZE
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          toast("Standard regular fit. Order your usual size.", {
                            icon: "📏",
                          })
                        }
                        className="text-[11px] font-medium text-brand-textSec underline underline-offset-2 hover:text-brand-charcoal transition-colors cursor-pointer"
                      >
                        Size Guide
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.variants?.map((v) => {
                        const isOutOfStock = v.stock <= 0;
                        const isSelected = selectedVariantId === v.id;

                        return (
                          <button
                            key={v.id}
                            disabled={isOutOfStock}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`min-w-[48px] h-[38px] px-3 text-xs font-semibold uppercase rounded-sm border transition-all ${
                              isOutOfStock
                                ? "bg-brand-stone/30 text-brand-caption border-brand-border line-through cursor-not-allowed"
                                : isSelected
                                ? "bg-white text-brand-charcoal border-brand-charcoal shadow-sm ring-1 ring-brand-charcoal cursor-pointer"
                                : "bg-white text-brand-charcoal border-brand-border hover:border-brand-charcoal cursor-pointer"
                            }`}
                          >
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Action Buttons (Add to Bag & Buy Now) */}
                  <div className="mt-5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* ADD TO BAG */}
                      <button
                        onClick={handleAddToCart}
                        disabled={selectedVariantId !== null && isCurrentOutOfStock}
                        className="w-full py-3 bg-brand-btn text-white text-[11px] font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {selectedVariantId && isCurrentOutOfStock
                          ? "OUT OF STOCK"
                          : "ADD TO BAG"}
                      </button>

                      {/* BUY NOW */}
                      <button
                        onClick={handleBuyNow}
                        disabled={selectedVariantId !== null && isCurrentOutOfStock}
                        className="w-full py-3 bg-brand-card border border-brand-charcoal text-brand-charcoal text-[11px] font-semibold uppercase tracking-widest rounded-sm hover:bg-white active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        BUY IT NOW
                      </button>
                    </div>

                    {/* Shipping Subtext */}
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-brand-textSec">
                      <Truck size={13} className="stroke-[1.6]" />
                      <span>Complimentary shipping on all prepaid orders.</span>
                    </div>
                  </div>

                  {/* 5. Specs & Accordions (Smooth Auto-Scrolls into view) */}
                  <div className="mt-5 border-t border-brand-border divide-y divide-brand-border/80">
                    {/* DETAILS & SPECS */}
                    <div ref={detailsSectionRef} className="py-3 scroll-mt-4">
                      <button
                        onClick={() => toggleSection("details")}
                        className="w-full flex justify-between items-center text-[11px] font-bold tracking-widest uppercase text-brand-charcoal hover:text-brand-olive transition-colors cursor-pointer"
                      >
                        <span>PRODUCT DETAILS & SPECS</span>
                        {openSection === "details" ? (
                          <Minus size={14} />
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {openSection === "details" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs text-brand-textSec leading-relaxed mt-2.5 font-light">
                              {product.description ||
                                "A classic combination that speaks of quiet power and timeless style. Crafted in premium fabrics for all-day comfort and effortless sophistication."}
                            </p>

                            {/* 4 Badges */}
                            <div className="grid grid-cols-4 gap-1.5 pt-3.5 pb-1 text-center">
                              <div className="flex flex-col items-center">
                                <Sparkles className="w-3.5 h-3.5 text-brand-charcoal stroke-[1.4] mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-charcoal leading-tight">
                                  Breathable<br />Fabric
                                </span>
                              </div>
                              <div className="flex flex-col items-center">
                                <Shirt className="w-3.5 h-3.5 text-brand-charcoal stroke-[1.4] mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-charcoal leading-tight">
                                  Tailored<br />Fit
                                </span>
                              </div>
                              <div className="flex flex-col items-center">
                                <ShieldCheck className="w-3.5 h-3.5 text-brand-charcoal stroke-[1.4] mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-charcoal leading-tight">
                                  Premium<br />Quality
                                </span>
                              </div>
                              <div className="flex flex-col items-center">
                                <Smile className="w-3.5 h-3.5 text-brand-charcoal stroke-[1.4] mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-charcoal leading-tight">
                                  Everyday<br />Comfort
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* WASH & CARE */}
                    <div ref={careSectionRef} className="py-3 scroll-mt-4">
                      <button
                        onClick={() => toggleSection("care")}
                        className="w-full flex justify-between items-center text-[11px] font-bold tracking-widest uppercase text-brand-charcoal hover:text-brand-olive transition-colors cursor-pointer"
                      >
                        <span>WASH & CARE</span>
                        {openSection === "care" ? (
                          <Minus size={14} />
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {openSection === "care" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <ul className="text-xs text-brand-textSec space-y-1 mt-2.5 font-light list-disc list-inside">
                              <li>Machine wash cold (30°C) with like colors</li>
                              <li>Do not bleach or tumble dry</li>
                              <li>Dry in shade on a hanger</li>
                              <li>Warm steam iron recommended</li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* RETURNS & EXCHANGES */}
                    <div ref={returnsSectionRef} className="py-3 scroll-mt-4">
                      <button
                        onClick={() => toggleSection("returns")}
                        className="w-full flex justify-between items-center text-[11px] font-bold tracking-widest uppercase text-brand-charcoal hover:text-brand-olive transition-colors cursor-pointer"
                      >
                        <span>RETURNS & EXCHANGES</span>
                        {openSection === "returns" ? (
                          <Minus size={14} />
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {openSection === "returns" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs text-brand-textSec leading-relaxed mt-2.5 font-light">
                              We offer a hassle-free 72-hour doorstep return &amp;
                              exchange policy. Ensure items are unworn with original tags attached.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};