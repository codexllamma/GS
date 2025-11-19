"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: { url: string; isPrimary: boolean }[];
  category?: string;
  stock?: number;
  createdAt?: string;
}

const Hero = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/product");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();

        const mapped = data.map((p: any) => ({
          ...p,
          createdAt: typeof p.createdAt === "string"
            ? p.createdAt
            : new Date(p.createdAt).toISOString(),
          images: p.images ?? [],
        }));

        setProducts(mapped);
      } catch (err) {
        console.error(err);
        setError("Could not load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">

      {/* HERO SECTION */}
      <section className="relative px-6 py-24 text-center backdrop-blur-lg bg-white/50 rounded-3xl shadow-xl mx-4 mt-6 border border-white/30">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          Step Into Premium
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Crafted to elevate your presence — comfort engineered into every piece.
        </p>

        <Link href="/product/products">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="mt-6 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 text-white px-6 py-3 rounded-full shadow-md font-semibold"
          >
            Explore Collection
          </motion.button>
        </Link>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mt-16 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">
          Featured Styles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => {
            const img = product.images?.[0]?.url;

            return (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.03 }}
                className="backdrop-blur-lg bg-white/70 border border-white/30 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="h-64 w-full overflow-hidden">
                  {img ? (
                    <Image
                      src={img}
                      alt={product.name}
                      width={500}
                      height={400}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-800">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {product.name}
                  </h3>

                  <p className="text-blue-600 font-bold mt-1">
                    ₹{product.basePrice}
                  </p>

                  <Link href={`/product/${product.id}`}>
                    <button className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-full hover:bg-blue-700 transition-colors">
                      View Product
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CAROUSEL */}
      <section className="mt-20 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">
          Lookbook
        </h2>

        <div className="overflow-hidden rounded-2xl shadow-xl relative max-w-6xl mx-auto">
          <motion.div
            animate={{ x: [0, -100, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="flex gap-4"
          >
            {products.map((product) => {
              const img = product.images?.[0]?.url;
              if (!img) return null;

              return (
                <Image
                  key={product.id}
                  src={img}
                  alt="Lookbook"
                  width={600}
                  height={400}
                  className="rounded-xl object-cover w-[600px] h-[400px]"
                />
              );
            })}
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Hero;
