import { useEffect, useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";
import ProductCard from "@/components/productCard";
import Header from "@/components/header";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCartIds, setAddedToCartIds] = useState<string[]>([]);

  const { status } = useSession();
  const addToCartStore = useCartStore((state) => state.addToCart);

  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  
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

  const handleAddToCart = async (product: Product) => {
    if (status !== "authenticated") {
      setError("Please sign in to add to cart.");
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to add to cart.");
        return;
      }

      setAddedToCartIds((prev) => [...prev, product.id]);
      addToCartStore(product.id, 1); 

      alert("Added to cart!");
    } catch (err) {
      console.error("Error adding to cart", err);
      setError("Failed to add to cart.");
    }
  };

  return (
    <>
      <Header/>
      <Head>
        <title>Products | YourStore</title>
        <meta name="description" content="Browse our products" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && products.length === 0 && <p>No products available.</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdded={addedToCartIds.includes(product.id)}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </main>
    </>
  );
}



/*
import { useEffect, useState } from "react";
import Head from "next/head";
import { useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import ProductCard from "@/components/productCard";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { data: session, status } = useSession();
  const addToLocalCart = useCartStore((state) => state.addToCart);

  const [addedToCartIds, setAddedToCartIds] = useState<string[]>([]);
   useEffect(() => {
  if (error) {
    const timer = setTimeout(() => {
      setError(null);
    }, 3500);

    return () => clearTimeout(timer); // cleanup if component unmounts or uiMessage changes
  }
  }, [error]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/product");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Could not load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleViewProduct = (id: string) => {
  router.push(`/product/${id}`);
  };

  const handleAddToCart = async (product: Product) => {
    if (status !== "authenticated") {
      setError("Please sign in to add to cart.");
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to add to cart.");
        return;
      }
      
      const updatedCart = await res.json();
      setAddedToCartIds((prev) => [...prev, product.id]);
      alert("Added to cart!");
      // Optionally, show a toast
    } catch (error) {
      console.error("Error adding to cart", error);
    }
  };

  const handleInterested = (product: Product) => {
    console.log(`User interested in product: ${product.name}`);
    alert(`Thanks! We will notify you when ${product.name} is restocked.`);
    // For post-deployment: POST to /api/restock-interest with userId and productId
  };

  return (
    
    <>
      <Head>
        <title>Products | YourStore</title>
        <meta name="description" content="Browse our products" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && products.length === 0 && <p>No products available.</p>}
        </div>
        {!loading && products.length > 0 && (
          
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard
                Product 
              />
              
              
            ))}
          </div>
        )}
      </>
  );
}
  */
  /*
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && products.length === 0 && <p>No products available.</p>}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 shadow hover:shadow-lg transition"
                >
                  
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded"
                  /> 
                  <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
                  <p className="text-gray-500">{product.category}</p>
                  <p className="text-primary font-bold mt-1">₹{product.price}</p>

                  {isOutOfStock ? (
                    <>
                      <button
                        disabled
                        className="mt-3 w-full py-2 rounded bg-gray-400 text-white cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                      <button
                        onClick={() => handleInterested(product)}
                        className="mt-2 w-full py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white transition"
                      >
                        Interested? Notify Me
                      </button>
                    </>
                  ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={addedToCartIds.includes(product.id) || product.stock <= 0}
                        className={`px-4 py-2 rounded w-full ${
                          product.stock <= 0 || addedToCartIds.includes(product.id)
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {product.stock <= 0
                          ? "Out of Stock"
                          : addedToCartIds.includes(product.id)
                          ? "Added to Cart"
                          : "Add to Cart"}
                      </button>
                  )}
                  <button 
                  onClick={() => handleViewProduct(product.id)}
                  className="bg-amber-500 hover:bg--white mt-3 w-full py-2 rounded">
                    View Product
                  </button>
                </div>
                
              );
              
            })}
          </div>
        )}
      </div>
    </>
  );
}
*/
/*
import { useEffect, useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/productCard";
import { Product as PrismaProduct } from "@/generated/prisma";
import { useCartStore } from "@/store/useCartStore";

interface Product extends Omit<PrismaProduct, 'createdAt'> {
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status } = useSession();
  const addToCart = useCartStore((state) => state.addToCart);
  const [addedToCartIds, setAddedToCartIds] = useState<string[]>([]);

  // Clear error after 3.5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch products
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/product');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data: PrismaProduct[] = await res.json();
        // Convert createdAt to string if needed
        const mapped = data.map((p) => ({ ...p, createdAt: p.createdAt.toString() }));
        setProducts(mapped);
      } catch (err) {
        console.error(err);
        setError('Could not load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async (product: Product) => {
    if (status !== 'authenticated') {
      setError('Please sign in to add to cart.');
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to add to cart.');
        return;
      }
      setAddedToCartIds((prev) => [...prev, product.id]);
      alert('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart', err);
      setError('Failed to add to cart.');
    }
  };

  return (
    <>
      <Head>
        <title>Products | YourStore</title>
        <meta name="description" content="Browse our products" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && products.length === 0 && <p>No products available.</p>}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleAdd}
                
              />
            
            ))}
          </div>
        )}
      </div>
    </>
  );
}
*/
/*
<motion.button
              `whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white p-3 rounded-2xl transition-all premium-shadow"
            >
              <ShoppingCart size={18} />
              //<span>Add to Cart</span>
            </motion.button>
*/