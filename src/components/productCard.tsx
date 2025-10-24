
'use client';

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnimatePresence,motion} from "framer-motion";
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description:string;
    basePrice: number;
    images: { url: string; isPrimary: boolean }[];
    category?: string; 
    stock?: number;    
    createdAt?: string;
  };
  isAdded?: boolean; 
  onAddToCart?: (id: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = product.images || [];
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    setDirection(1);
    setCurrentImage((prev) => (prev + 1) % images.length);
  };
  
  const handlePrev = () => {
    setDirection(-1);
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };
  
  
  console.log("IMAGE URL:", images[currentImage]?.url);

  return (
    <div className="group relative flex flex-col cursor-pointer transition-all duration-500 hover:scale-[1.005]">
      
      <div className="relative w-[350px] h-[500px] aspect-[10/11] overflow-hidden rounded-xl bg-gray-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={images[currentImage]?.url}
          initial={{ opacity: 0, x: direction === 1 ? 15 : -15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 1 ? 15 : -15 }}
          transition={{
            duration: 0.7,
            ease: [0.25, 0.1, 0.05, 0.1],
            opacity: { duration: 0.35, ease: "easeInOut" }
          }}
          className="absolute inset-0"
        >
          <Image
            src={images[currentImage]?.url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-650 group-hover:scale-[1.005]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        </motion.div>
      </AnimatePresence>



        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-70 group-hover:translate-y-[-50%] transition-all duration-300 ease-out text-black rounded-full p-1.5"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-70 group-hover:translate-y-[-50%] transition-all duration-300 ease-out text-black rounded-full p-1.5"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>


      <div className="flex flex-col mt-4">
  <h3 className="text-[1.05rem] font-medium tracking-tight">{product.name}</h3>

  <div className="flex items-center justify-between mt-1">
    <p className="text-[14px] text-gray-700">₹{product.basePrice}</p>

    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart?.(product.id);
        }}
        className="flex items-center justify-center gap-2 border border-black text-black text-[14px] px-4.5 py-1.5 rounded-full hover:bg-black hover:text-white transition-all duration-550"
      >
        <ShoppingBag size={14} />
        Add to Bag
      </button>

      <Link
        href={`/product/${product.id}`}
        className="flex items-center justify-center border border-black rounded-full text-[12px] p-2.5 hover:bg-black hover:text-white transition-all duration-550"
      >
        <ArrowRight size={16} />
      </Link>
    </div>
  </div>
</div>


      
    </div>
  );
}
