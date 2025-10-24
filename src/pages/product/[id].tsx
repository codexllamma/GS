// /pages/product/[id].tsx
import Image from "next/image";
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import prisma from "@/lib/prisma";
import { AnimatePresence,motion } from "framer-motion";
interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
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

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please choose a size");
      return;
    }
  
    setAdded(true);
    // Temporary “added” animation
    setTimeout(() => setAdded(false), 3000);
  };
  
  const images = product.images ?? [];
  const mainImage = images[0]?.url || "/placeholder.png";

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[60%_40%] min-h-screen">
      <section className="relative max-h-screen lg:sticky top-0 overflow-y-auto bg-neutral-50 flex justify-center items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={images[currentImage]?.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            
            <Image
              src={images[currentImage]?.url}
              alt={product.name}
              height={1000}
              width={1500}
              className="object-cover"
            />
            
            
            
          </motion.div>
        </AnimatePresence>
  
        <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-neutral-50/90 to-transparent pointer-events-none" />
            {images.length > 1 && (
              <div className="fixed bottom-6 left-6 flex gap-3 z-20">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => setCurrentImage(i)}
                    className={`relative w-16 h-20 overflow-hidden rounded-md border ${
                      currentImage === i ? "border-black" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`Thumbnail ${i}`}
                      fill
                      className="object-cover opacity-80 hover:opacity-100"
                    />
                  </button>
                ))}
              </div>
            )}


        
      </section>
  
      {/* RIGHT SECTION — DETAILS */}
      <aside className="p-10 lg:p-16 flex flex-col justify-center space-y-10">
        {/* Product Name + Price */}
        <div>
          <h1 className="text-4xl font-light tracking-tight">{product.name}</h1>
          <p className="text-lg text-neutral-500 mt-1">
            ₹{product.basePrice.toLocaleString()}
          </p>
        </div>
  
        {/* Color Options (Mock) */}
        <div>
          <h3 className="text-sm uppercase tracking-wide text-neutral-600 mb-3">
            Color
          </h3>
          <div className="flex gap-3">
            {["Black", "Green", "Ivory"].map((c) => (
              <div
                key={c}
                className={`w-7 h-7 rounded-full border ${
                  c === product.color ? "border-black" : "border-gray-300"
                }`}
                style={{
                  backgroundColor:
                    c === "Ivory" ? "#f4f4f1" : c.toLowerCase(),
                }}
              />
            ))}
          </div>
        </div>
  
        {/* Size Selector */}
        <div>
          <h3 className="text-sm uppercase tracking-wide text-neutral-600 mb-3">
            Select Size
          </h3>
          <div className="flex gap-3">
            {product.variants?.map((v) => (
              <button
                key={v.size}
                onClick={() => setSelectedSize(v.size)}
                disabled={v.stock === 0}
                className={`border px-5 py-2 text-sm rounded-md transition-all ${
                  selectedSize === v.size
                    ? "border-black bg-black text-white"
                    : "border-gray-300 hover:border-black"
                } ${v.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
  
        {/* Add to Bag Section */}
        {/* Add to Bag Section (Animated) */}
<div className="pt-6 border-t border-neutral-200">
  <button
    onClick={handleAddToCart}
    disabled={!selectedSize}
    className={`w-full px-6 py-4 rounded-full border transition-colors duration-300 overflow-hidden relative ${
      !selectedSize
        ? "border-neutral-300 text-neutral-400"
        : added
        ? "border-black bg-black text-white"
        : "border-black hover:bg-black hover:text-white"
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
          className="flex items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm tracking-wide">
            <ShoppingBag size={18} />
            {selectedSize ? "Add to Bag" : "Select a size"}
          </span>
          <span className="text-sm font-light">
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
          Size {selectedSize} added ✓ —{" "}
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
          By making this payment, you accept the{" "}
          <a href="#" className="underline hover:text-black">
            Terms of Sale
          </a>{" "}
          and confirm that you have read our{" "}
          <a href="#" className="underline hover:text-black">
            Privacy Policy
          </a>
          .
        </div>
      </aside>
    </main>
  );
}
