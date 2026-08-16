"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router"; 
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

export default function ProductsGrid() {
  const router = useRouter(); 
  const { category, search } = router.query; 

  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Ref to store the current AbortController (to cancel old requests)
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- MASTER EFFECT: HANDLES RESET + FETCHING ---
  useEffect(() => {
    if (!router.isReady) return;

    const fetchProducts = async () => {
      // 1. CANCEL PREVIOUS REQUESTS
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Create new controller for this specific request
      const newController = new AbortController();
      abortControllerRef.current = newController;

      try {
        const isFirstPage = page === 1;

        if (isFirstPage) {
           setIsInitialLoading(true);
           setProducts([]); // Clear old products immediately
        } else {
           setIsLoadingMore(true);
        }

        // Build URL
        let url = `/api/product?page=${page}&limit=${BATCH_SIZE}`;
        if (category) url += `&category=${encodeURIComponent(category as string)}`;
        if (search) url += `&search=${encodeURIComponent(search as string)}`;

        // Pass the signal to fetch
        const res = await fetch(url, { signal: newController.signal });
        
        if (!res.ok) throw new Error("Failed to fetch");
        const newProducts: Product[] = await res.json();

        // If this request was aborted during JSON parsing, stop here
        if (newController.signal.aborted) return;

        if (newProducts.length < BATCH_SIZE) setHasMore(false);
        else setHasMore(true); // Reset hasMore if we got a full page

        setProducts((prev) => {
          // If page 1, completely replace. 
          if (isFirstPage) return newProducts;
          
          // Deduplicate
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newProducts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        
        setError(null);

      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Ignore aborted requests (this is normal behavior)
          console.log("Request aborted"); 
        } else {
          console.error(err);
          setError("Could not load products.");
        }
      } finally {
        // Only turn off loading if this is still the active request
        if (!newController.signal.aborted) {
           setIsInitialLoading(false);
           setIsLoadingMore(false);
        }
      }
    };

    fetchProducts();

    // Cleanup function: Abort if component unmounts
    return () => {
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }
    };
  }, [page, category, search, router.isReady]); // Dependencies

  // --- RESET PAGE ON FILTER CHANGE ---
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [category, search]);

  // Observer Logic
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isInitialLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
         setPage((prevPage) => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isInitialLoading, isLoadingMore, hasMore]);

  // Initial Loading Skeleton
  if (isInitialLoading)
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] gap-3 text-brand-textSec">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-olive"></div>
        <p className="text-[11px] font-semibold tracking-widest uppercase animate-pulse text-brand-charcoal">
          {category ? `Curating ${category}...` : "Curating Collection..."}
        </p>
      </div>
    );

  if (error) return (
    <div className="text-center py-16 text-brand-charcoal text-xs tracking-wider uppercase font-medium">
      {error}
    </div>
  );
  
  if (products.length === 0 && !isInitialLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-brand-textSec gap-3">
      <p className="text-sm font-light">No products found {category && `in ${category}`}.</p>
      <button 
        onClick={() => {
          const { category, search, ...rest } = router.query;
          router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        }} 
        className="text-brand-charcoal font-semibold underline underline-offset-4 text-[11px] tracking-wider uppercase hover:text-brand-olive transition-colors cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );

  const blocks = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE)
    blocks.push(products.slice(i, i + BATCH_SIZE));

  return (
    <section className="px-3 sm:px-6 md:px-12 lg:px-20 pt-1 pb-0">
      {/* Title for Filtered View */}
      {(category || search) && (
        <div className="mb-4 flex justify-between items-center border-b border-brand-border pb-2">
          <h1 className="text-lg sm:text-xl font-serif tracking-wider uppercase text-brand-charcoal">
            {category || "Search Results"}
            {search && (
              <span className="text-brand-textSec normal-case font-sans tracking-normal text-sm ml-2">
                for "{search}"
              </span>
            )}
          </h1>
          <button 
            onClick={() => {
              const { category, search, ...rest } = router.query;
              router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
            }} 
            className="text-[11px] font-semibold tracking-wider text-brand-textSec hover:text-brand-charcoal uppercase underline underline-offset-4 cursor-pointer transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="flex flex-col gap-10 md:gap-16">
        {blocks.map((block, idx) => {
          const heroLeft = idx % 2 !== 0; 
          return (
            <div key={idx} className="flex flex-col gap-6 md:gap-8">
              {/* Mobile View */}
              <div className="block md:hidden">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {block[0] && <ProductCard product={block[0]} priority={idx === 0} />}
                  {block[1] && <ProductCard product={block[1]} priority={idx === 0} />}
                </div>
                {block[2] && <HeroCard product={block[2]} priority={idx === 0} />}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {block[3] && <ProductCard product={block[3]} priority={false} />}
                  {block[4] && <ProductCard product={block[4]} priority={false} />}
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-6 w-full">
                {heroLeft ? (
                  <>
                    {block[2] && (
                      <div className="row-span-2 col-span-2">
                        <HeroCard product={block[2]} priority={true} />
                      </div>
                    )}
                    {block[0] && <ProductCard product={block[0]} priority={true} />}
                    {block[1] && <ProductCard product={block[1]} priority={true} />}
                    {block[3] && <ProductCard product={block[3]} priority={true} />}
                    {block[4] && <ProductCard product={block[4]} priority={true} />}
                  </>
                ) : (
                  <>
                    {block[0] && <ProductCard product={block[0]} priority={true} />}
                    {block[1] && <ProductCard product={block[1]} priority={true} />}
                    {block[2] && (
                      <div className="row-span-2 col-span-2 col-start-3 row-start-1">
                        <HeroCard product={block[2]} priority={true} />
                      </div>
                    )}
                    {block[3] && <ProductCard product={block[3]} priority={true} />}
                    {block[4] && <ProductCard product={block[4]} priority={true} />}
                  </>
                )}
              </div>

              {/* Batch 5 to 8 grid */}
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

        {/* Infinite Scroll Trigger & State Indicators */}
        <div ref={lastElementRef} className="min-h-[24px] py-2 flex justify-center items-center w-full">
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-olive"></div>
          )}
          {!hasMore && products.length > 0 && (
            <span className="text-brand-caption text-[11px] tracking-widest uppercase font-medium">
              End of collection
            </span>
          )}
        </div>
      </div>
    </section>
  );
}