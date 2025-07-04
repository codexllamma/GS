import { useEffect, useState } from "react";
import Head from "next/head";
import { useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";



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


  const { data: session, status } = useSession();
    const addToLocalCart = useCartStore((state) => state.addToCart);
    
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


const handleAddToCart = async (product: Product) => {
    

    if (status !== "authenticated") {
        alert("Please sign in to add to cart.");
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
                quantity: 1, // or your increment logic
            }),
        });

        if (!res.ok) {
            console.error("Failed to add to cart");
            return;
        }

        const updatedCart = await res.json();

        // Update local cart store if desired for instant UI
        // adjust to your `useCartStore` API

    } catch (error) {
        console.error("Error adding to cart", error);
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
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 shadow hover:shadow-lg transition"
              >
                {/* Uncomment when images are ready */}
                {/* <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                /> */}
                <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
                <p className="text-gray-500">{product.category}</p>
                <p className="text-primary font-bold mt-1">₹{product.price}</p>
                
                  <button 
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                  onClick={() => handleAddToCart(product)}
                  > Add to Cart
                  </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
