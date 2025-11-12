import Image from "next/image";
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import prisma from "@/lib/prisma";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/header";

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

    if (!product) {
      return { notFound: true };
    }

    return {
      props: { product: JSON.parse(JSON.stringify(product)) },
    };
  } catch (error) {
    console.error("Product fetch error:", error);
    return { notFound: true };
  }
};

export default function ProductDetailsPage({
  product,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Product not found.
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert("Please choose a size");
      return;
    }

    try {
      const variant = product.variants.find((v) => v.size === selectedSize);
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
      setTimeout(() => setAdded(false), 3000);
    } catch (error: any) {
      console.error("Add to cart error:", error);
      alert(error.message || "Could not add item to cart.");
    }
  };

  const images = product.images ?? [];

  return (
    <>
      <Header />
        <main className="grid grid-cols-1 lg:grid-cols-[10%_55%_35%] min-h-screen overflow-x-hidden bg-neutral-50">
    {/* LEFT COLUMN — Thumbnails */}
    <div
      className="hidden lg:flex flex-col items-center justify-center gap-4 border-r border-neutral-200 p-4"
    >
      {images.map((img, i) => (
        <button
          key={img.url}
          onClick={() => setCurrentImage(i)}
          className={`relative w-20 h-24 overflow-hidden rounded-md border transition-all ${
            currentImage === i
              ? 'border-black'
              : 'border-transparent hover:border-gray-400'
          }`}
        >
          <Image
            src={img.url}
            alt={`Thumbnail ${i}`}
            fill
            className="object-cover opacity-90 hover:opacity-100"
          />
        </button>
      ))}
    </div>

    {/* CENTER COLUMN — Main Image */}
    <div
      className="
        relative flex items-center justify-center bg-white 
        p-4 sm:p-6 md:p-8
      "
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={images[currentImage]?.url}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative w-full h-full flex items-center justify-center"
        >
          <Image
            src={images[currentImage]?.url}
            alt={product.name}
            width={1100}
            height={1300}
            className="object-contain max-h-[90vh] sm:max-h-[95vh] w-auto"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Mobile thumbnails carousel */}
      <div
        className="
          flex lg:hidden 
          justify-center gap-2 mt-3 absolute bottom-4 left-0 right-0
        "
      >
        {images.map((img, i) => (
          <button
            key={img.url}
            onClick={() => setCurrentImage(i)}
            className={`relative w-12 h-16 overflow-hidden border ${
              currentImage === i
                ? 'border-black'
                : 'border-transparent hover:border-gray-400'
            }`}
          >
            <Image
              src={img.url}
              alt={`Thumbnail ${i}`}
              fill
              className="object-cover opacity-80"
            />
          </button>
        ))}
      </div>
    </div>

    {/* RIGHT COLUMN — Product Info */}
    <aside
      className="
        p-6 sm:p-8 lg:p-10 
        flex flex-col justify-center 
        space-y-8 sm:space-y-10 
        bg-neutral-50 
        border-t lg:border-t-0 lg:border-l border-neutral-200
      "
    >
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight">
          {product.name}
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 mt-1">
          ₹{product.basePrice.toLocaleString()}
        </p>
      </div>

      {/* Color Selector */}
      <div>
        <h3 className="text-xs sm:text-sm uppercase tracking-wide text-neutral-600 mb-3">
          Color
        </h3>
        <div className="flex gap-3">
          {['Black', 'Green', 'Ivory'].map((c) => (
            <div
              key={c}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border ${
                c === product.color ? 'border-black' : 'border-gray-300'
              }`}
              style={{
                backgroundColor: c === 'Ivory' ? '#f4f4f1' : c.toLowerCase(),
              }}
            />
          ))}
        </div>
      </div>

      {/* Size Selector */}
      <div>
        <h3 className="text-xs sm:text-sm uppercase tracking-wide text-neutral-600 mb-3">
          Select Size
        </h3>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          {product.variants?.map((v) => (
            <button
              key={v.size}
              onClick={() => setSelectedSize(v.size)}
              disabled={v.stock === 0}
              className={`border px-4 py-1.5 sm:px-5 sm:py-2 text-sm rounded-md transition-all ${
                selectedSize === v.size
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-black'
              } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {v.size}
            </button>
          ))}
        </div>
      </div>

      {/* Add to Bag */}
      <div className="pt-6 border-t border-neutral-200 flex justify-center">
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize}
          className={`w-full sm:w-[400px] h-[50px] px-3 py-1 border transition-colors duration-300 overflow-hidden relative ${
            !selectedSize
              ? 'border-neutral-300 text-neutral-400'
              : added
              ? 'border-black bg-black text-white'
              : 'border-black hover:bg-black hover:text-white'
          }`}
        >
          <AnimatePresence mode="wait">
            {!added ? (
              <motion.div
                key="not-added"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 tracking-wide">
                  <ShoppingBag size={18} />
                  {selectedSize ? 'Add to Bag' : 'Select a size'}
                </span>
                <span className="hidden sm:block font-light">
                  ₹{product.basePrice.toLocaleString()}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="added"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="w-full text-center text-sm text-white"
              >
                Size {selectedSize} added ✓ —{' '}
                <a href="/checkout" className="underline">
                  Checkout
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Terms + Description */}
      <div className="border-t border-neutral-200 pt-6 text-xs text-neutral-500 leading-relaxed">
        By making this payment, you accept the{' '}
        <a href="#" className="underline hover:text-black">
          Terms of Sale
        </a>{' '}
        and confirm that you have read our{' '}
        <a href="#" className="underline hover:text-black">
          Privacy Policy
        </a>
        .
      </div>
    </aside>
  </main>

    </>
  );
}
