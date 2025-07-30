'use client';
import Image from "next/image";
import Link from "next/link";
import {motion} from 'framer-motion';
import { useState,useEffect } from "react";

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

const Hero = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCartIds, setAddedToCartIds] = useState<string[]>([]);
  
  useEffect(() => {
      (async () => {
        try {
          const res = await fetch("/api/product");
          if (!res.ok) throw new Error("Failed to fetch products");
  
          const data = await res.json();
  
          const mapped = data.map((p: any) => ({
            ...p,
            createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
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
    <>
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-white to-orange-100">
      {/* Hero Section */}
      <section className="relative px-6 py-24 text-center backdrop-blur-lg bg-white/30 rounded-3xl shadow-xl mx-4 mt-6 border border-white/20">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
          Step Into Premium
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Elevate your wardrobe with pieces crafted to impress. Designed for comfort, built for confidence.
        </p>
        <Link href="/product/products">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="mt-6 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white px-6 py-3 rounded-full shadow-md font-semibold"
          >
            Explore Collection
          </motion.button>
        </Link>
      </section>

      {/* Featured Products */}
      <section className="mt-16 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-prussian mb-8 text-center">Featured Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.03 }}
              className="backdrop-blur-lg bg-white/60 border border-white/20 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="h-64 w-full overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={500}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
                <p className="text-orange-500 font-bold mt-1">₹{product.price}</p>
                <Link href={`/product/${product.id}`}>
                  <button className="mt-4 px-4 py-2 bg-prussian text-white rounded-full hover:bg-blue-900 transition-colors">
                    View Product
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Carousel */}
      <section className="mt-20 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-prussian mb-8 text-center">Lookbook</h2>
        <div className="overflow-hidden rounded-2xl shadow-xl relative max-w-6xl mx-auto">
          <motion.div
            animate={{ x: [0, -100, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="flex gap-4"
          >
            {products.map((product) => (
              <Image
                key={product.id}
                src={product.image}
                alt="Look"
                width={600}
                height={400}
                className="rounded-xl object-cover w-[600px] h-[400px]"
              />
            ))}
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}

export default Hero;

