"use client";

import { useEffect, useState } from "react";
import ProductCard from "./productCard";
import HeroCard from "./heroCard";

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
      } catch {
        setError("Could not load products. Try refreshing.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20 text-gray-500 text-sm">
        Loading products...
      </div>
    );

  if (error)
    return <div className="text-center py-20 text-red-500 font-medium">{error}</div>;

  if (products.length === 0)
    return (
      <div className="text-center py-20 text-gray-500">
        No products available yet.
      </div>
    );

  const chunkSize = 5;
  const blocks = [];
  for (let i = 0; i < products.length; i += chunkSize)
    blocks.push(products.slice(i, i + chunkSize));

  return (
    <section className="px-3 sm:px-6 md:px-12 lg:px-20 py-12">

      <div className="space-y-16">
        {blocks.map((block, idx) => {
          const heroLeft = idx % 2 === 0;
          return (
            <div key={idx} className="gap-4 md:gap-8">
              {/* MOBILE */}
              <div className="block md:hidden col-span-2">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {block[0] && <ProductCard product={block[0]} />}
                  {block[1] && <ProductCard product={block[1]} />}
                </div>
                {block[2] && <HeroCard product={block[2]} />}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {block[3] && <ProductCard product={block[3]} />}
                  {block[4] && <ProductCard product={block[4]} />}
                </div>
              </div>

              {/* DESKTOP */}
              <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-6 w-full">
                {heroLeft ? (
                  <>
                    {block[0] && <ProductCard product={block[0]} />}
                    {block[1] && <ProductCard product={block[1]} />}
                    {block[2] && (
                      <div className="row-span-2 col-span-2">
                        <HeroCard product={block[2]} />
                      </div>
                    )}
                    {block[3] && <ProductCard product={block[3]} />}
                    {block[4] && <ProductCard product={block[4]} />}
                  </>
                ) : (
                  <>
                    {block[0] && <ProductCard product={block[0]} />}
                    {block[1] && <ProductCard product={block[1]} />}
                    {block[2] && (
                      <div className="row-span-2 col-span-2 col-start-1">
                        <HeroCard product={block[2]} />
                      </div>
                    )}
                    {block[3] && <ProductCard product={block[3]} />}
                    {block[4] && <ProductCard product={block[4]} />}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
