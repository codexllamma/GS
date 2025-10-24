
"use client";

import { useEffect, useState } from "react";
import ProductCard from "./productCard";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  color: string;
  fabric: string;
  category: string;
  images: { url: string; isPrimary: boolean }[];
  variants: { size: string; price: number; stock: number }[];
  createdAt: string;
}

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/product");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Could not load products. Try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500 text-sm tracking-wide">Loading products...</p>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-red-500 font-medium">
        {error}
      </div>
    );

  if (products.length === 0)
    return (
      <div className="text-center py-20 text-gray-500">
        No products available yet.
      </div>
    );

  return (
    <section className="px-6 md:px-12 lg:px-20 py-10">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
        Our Collection
      </h2>

      <AnimatePresence>
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard
                product={{
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  basePrice: product.basePrice,
                  images: product.images?.length
                  ? product.images
                  : [{ url: "/placeholder.png", isPrimary: true }],
                  category: product.category || "Uncategorized",
                  stock:
                    product.variants?.reduce(
                      (sum, v) => sum + (v.stock || 0),
                      0
                    ) || 0,
                  createdAt: product.createdAt,
                }}
                isAdded={false}
                onAddToCart={() => {}}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
