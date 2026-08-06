"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ShoppingBag, X, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

export const ProductModal: React.FC<ProductModalProps> = ({ productId, onClose, onOpenCart }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  // Zustand Store Actions
  const addToCart = useCartStore((state) => state.addToCart);
  const buyNow = useCartStore((state) => state.buyNow);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setSelectedVariantId(null);
      setCurrentImage(0);
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/product/${productId}`);
        if (!res.ok) throw new Error("Product fetch failed");
        const data: Product = await res.json();

        const sortedImages = data.images
          ? [...data.images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
          : [];

        setProduct({ ...data, images: sortedImages });

        if (data.variants && data.variants.length > 0) {
          const inStockVariant = data.variants.find((v) => v.stock > 0);
          setSelectedVariantId(inStockVariant ? inStockVariant.id : data.variants[0].id);
        }
      } catch (err) {
        console.error("Modal Product Fetch Error:", err);
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

    // Meta Pixel: ViewContent
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "ViewContent", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.basePrice,
        currency: "INR",
      });
    }

    // GA4: view_item
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
  const mainImgUrl = getSafeUrl(images[currentImage]?.url) || "https://placehold.co/600x800/png?text=No+Image";

  const currentVariant = product?.variants?.find((v) => v.id === selectedVariantId);
  const activePrice =
    currentVariant?.price && currentVariant.price > 0 ? currentVariant.price : product?.basePrice ?? 0;
  const isCurrentOutOfStock = currentVariant ? currentVariant.stock <= 0 : false;

  // 1. Standard Add to Bag (Keeps existing selections intact & opens Cart Sheet)
  const handleAddToCart = () => {
    if (!selectedVariantId || !currentVariant || !product) {
      toast.error("Please select a size");
      return;
    }

    if (isCurrentOutOfStock) {
      toast.error("Selected size is out of stock");
      return;
    }

    // --- Analytics Tracking: Standard Add to Bag ---
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: activePrice,
        currency: "INR",
        button_type: "add_to_bag",
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

  // 2. Buy Now (Deselects previous items, selects ONLY this item, opens CartSheet)
  const handleBuyNow = () => {
    if (!selectedVariantId || !currentVariant || !product) {
      toast.error("Please select a size");
      return;
    }

    if (isCurrentOutOfStock) {
      toast.error("Selected size is out of stock");
      return;
    }

    // --- Analytics Tracking: Instant Buy Flow ---
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: activePrice,
        currency: "INR",
        button_type: "buy_now",
      });
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: activePrice,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-white/80 p-2 rounded-full hover:bg-white text-black shadow-md backdrop-blur-sm transition cursor-pointer"
          >
            <X size={20} />
          </button>

          {loading || !product ? (
            <div className="w-full h-96 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Left Gallery */}
              <div className="w-full md:w-1/2 bg-neutral-100 relative flex flex-col items-center justify-center p-4">
                <div className="relative w-full h-[350px] sm:h-[420px] rounded-lg overflow-hidden">
                  <Image src={mainImgUrl} alt={product.name} fill unoptimized className="object-contain" />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full hover:bg-white text-black shadow cursor-pointer"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full hover:bg-white text-black shadow cursor-pointer"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`w-12 h-14 relative border-2 rounded overflow-hidden flex-shrink-0 cursor-pointer ${
                          currentImage === idx ? "border-black" : "border-transparent opacity-60"
                        }`}
                      >
                        <Image src={getSafeUrl(img.url)} alt="" fill unoptimized className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Details */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
                <div>
                  <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                    {product.fabric?.category?.name || "Collection"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">{product.name}</h2>
                  <p className="text-xl font-bold text-neutral-900 mt-2">₹{activePrice.toLocaleString()}</p>

                  {/* Size Selector */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                        Select Size
                      </label>
                      {currentVariant && (
                        <span className="text-[11px] text-neutral-500">
                          {isCurrentOutOfStock ? (
                            <span className="text-red-500 font-semibold">Out of stock</span>
                          ) : (
                            `${currentVariant.stock} left in stock`
                          )}
                        </span>
                      )}
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
                            className={`min-w-[48px] h-[48px] px-3.5 text-xs font-bold rounded border transition-all ${
                              isOutOfStock
                                ? "bg-neutral-100 text-neutral-300 border-neutral-200 line-through cursor-not-allowed"
                                : isSelected
                                ? "bg-black text-white border-black shadow-md scale-[1.02] cursor-pointer"
                                : "bg-white text-neutral-800 border-neutral-300 hover:border-black hover:bg-neutral-50 cursor-pointer"
                            }`}
                          >
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-6 border-t border-neutral-100 pt-4">
                    <p className="text-xs text-neutral-600 leading-relaxed max-w-none">{product.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-2 pt-4 border-t border-neutral-100">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={!selectedVariantId || isCurrentOutOfStock}
                      className={`w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded transition flex items-center justify-center gap-2 ${
                        !selectedVariantId || isCurrentOutOfStock
                          ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-200"
                          : "bg-neutral-100 text-black border border-black hover:bg-neutral-200 cursor-pointer"
                      }`}
                    >
                      <ShoppingBag size={16} />
                      {isCurrentOutOfStock ? "Out of Stock" : "Add to Bag"}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={!selectedVariantId || isCurrentOutOfStock}
                      className={`w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded transition flex items-center justify-center gap-2 ${
                        !selectedVariantId || isCurrentOutOfStock
                          ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                          : "bg-black text-white hover:bg-neutral-800 cursor-pointer"
                      }`}
                    >
                      <Zap size={16} />
                      Buy Now
                    </button>
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