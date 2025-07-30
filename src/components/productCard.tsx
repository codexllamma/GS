'use client';

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt: string;
}

interface ProductCardProps {
  product: Product;
  isAdded: boolean;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = () => {
    addToCart(product.id, 1);
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
      <Image
        src={product.image}
        alt={product.name}
        width={300}
        height={200}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-600">{product.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold">₹{product.price}</span>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            <ShoppingCart size={18} />
            
          </button>
        </div>
      </div>
    </div>
  );
}
