"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

const BATCH_SIZE = 9;

// Helper: Preload (Same as before)
const preloadImage = (url: string) => {
  return new Promise((resolve) => {
    if (!url) { resolve(true); return; }
    const img = new Image();
    img.src = url.replace(/ /g, "%20"); 
    img.onload = () => resolve(true);
    img.onerror = () => resolve(true); 
  });
};

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // --- 1. DETECT DEVICE TYPE ---
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- FETCHING LOGIC ---
  useEffect(() => {
    const fetchProducts = async () => {
      if (!hasMore) return;

      try {
        if (page === 1) setIsInitialLoading(true);
        else setIsLoadingMore(true);

        const res = await fetch(`/api/product?page=${page}&limit=${BATCH_SIZE}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const newProducts: Product[] = await res.json();

        if (newProducts.length < BATCH_SIZE) setHasMore(false);

        // --- 2. CONDITIONAL PRELOADING ---
        if (newProducts.length > 0) {
          
          // LOGIC SPLIT:
          // Desktop: Wait for images (Premium feel)
          // Mobile: Skip wait (Fast feel)
          if (!isMobile) {
             const imageUrlsToPreload = newProducts.map((p) => {
                const displayImg = p.images.find(img => img.isPrimary) || p.images[0];
                return displayImg?.url;
             }).filter((url): url is string => !!url);

             await Promise.all(imageUrlsToPreload.map((url) => preloadImage(url)));
          }
        }

        setProducts((prev) => {
          if (page === 1) return newProducts;
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newProducts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });

      } catch (err) {
        setError("Could not load products. Try refreshing.");
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchProducts();
  }, [page, isMobile]); 


  // ... (Observer Logic) ...
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isInitialLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setPage((prevPage) => prevPage + 1);
    });
    if (node) observer.current.observe(node);
  }, [isInitialLoading, isLoadingMore, hasMore]);


  // ... (Render Logic) ...
  if (isInitialLoading)
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="text-sm font-medium animate-pulse">Loading Collection...</p>
      </div>
    );

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (products.length === 0) return <div className="text-center py-20 text-gray-500">No products.</div>;

  const blocks = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE)
    blocks.push(products.slice(i, i + BATCH_SIZE));

  return (
    <section className="px-3 sm:px-6 md:px-12 lg:px-20 py-12">
      <div className="flex flex-col gap-16">
        {blocks.map((block, idx) => {
          const heroLeft = idx % 2 !== 0; 
          return (
            <div key={idx} className="flex flex-col gap-8">
              
              {/* MOBILE */}
              <div className="block md:hidden">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {block[0] && <ProductCard product={block[0]} priority={idx === 0} />}
                  {block[1] && <ProductCard product={block[1]} priority={idx === 0} />}
                </div>
                {block[2] && <HeroCard product={block[2]} priority={idx === 0} />}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {block[3] && <ProductCard product={block[3]} priority={false} />}
                  {block[4] && <ProductCard product={block[4]} priority={false} />}
                </div>
              </div>

              {/* DESKTOP */}
              <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-6 w-full">
                {heroLeft ? (
                  <>
                    {block[2] && <div className="row-span-2 col-span-2"><HeroCard product={block[2]} priority={true} /></div>}
                    {block[0] && <ProductCard product={block[0]} priority={true} />}
                    {block[1] && <ProductCard product={block[1]} priority={true} />}
                    {block[3] && <ProductCard product={block[3]} priority={true} />}
                    {block[4] && <ProductCard product={block[4]} priority={true} />}
                  </>
                ) : (
                  <>
                    {block[0] && <ProductCard product={block[0]} priority={true} />}
                    {block[1] && <ProductCard product={block[1]} priority={true} />}
                    {block[2] && <div className="row-span-2 col-span-2 col-start-3 row-start-1"><HeroCard product={block[2]} priority={true} /></div>}
                    {block[3] && <ProductCard product={block[3]} priority={true} />}
                    {block[4] && <ProductCard product={block[4]} priority={true} />}
                  </>
                )}
              </div>

              {/* BOTTOM ROW */}
              {block[5] && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full">
                  {block[5] && <ProductCard product={block[5]} priority={!isMobile} />}
                  {block[6] && <ProductCard product={block[6]} priority={!isMobile} />}
                  {block[7] && <ProductCard product={block[7]} priority={!isMobile} />}
                  {block[8] && <ProductCard product={block[8]} priority={!isMobile} />}
                </div>
              )}
            </div>
          );
        })}

        {/* LOADING MORE + END OF COLLECTION TEXT */}
        <div ref={lastElementRef} className="h-20 flex justify-center items-center w-full">
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          )}
          {/* RESTORED THIS PART */}
          {!hasMore && products.length > 0 && (
             <span className="text-gray-400 text-sm">End of collection.</span>
          )}
        </div>
      </div>
    </section>
  );
}