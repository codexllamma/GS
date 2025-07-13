import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
  if (error) {
    const timer = setTimeout(() => {
      setError(null);
    }, 3500);

    return () => clearTimeout(timer); // cleanup if component unmounts or uiMessage changes
  }
  }, [error]);
  

  

  const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart");
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();
        setCartItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (cartOrderId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartOrderId, quantity: newQuantity }),
      });
      
      
      const data = await res.json();
      if (!res.ok) setError(data.message || "Failed to update quantity")
      
      
      
      fetchCart();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteItem = async (cartOrderId: string) => {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartOrderId }),
      });
      console.log(cartOrderId);
      if (!res.ok) setError("Failed to delete item");

      setCartItems((prev) => prev.filter((item) => item.id !== cartOrderId));
    } catch (error) {
      console.error(error);
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <>
      <Head>
        <title>Cart | YourStore</title>
      </Head>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        {loading && <p>Loading cart...</p>}
        {!loading && cartItems.length === 0 && (
          <p>Your cart is empty. Start shopping!</p>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && cartItems.length > 0 && (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="border p-4 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{item.product.name}</p>
                  {item.product.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}

                  <p className="text-sm text-gray-500">
                    Category: {item.product.category}
                  </p>
                  <p className="text-sm">Price: ₹{item.product.price}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      className="bg-gray-200 px-2 rounded hover:bg-gray-300 transition"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      className="bg-gray-200 px-2 rounded hover:bg-gray-300 transition"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-semibold">
                    ₹{item.product.price * item.quantity}
                  </p>
                  <button
                    className="text-red-600 text-sm mt-2 hover:underline"
                    onClick={() => deleteItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="text-right font-bold text-lg mt-6">
              Total: ₹{totalPrice}
            </div>
           <button
            disabled={cartItems.length === 0}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            onClick={() => router.push("/checkout")}
          > Proceed to Checkout </button>

          </div>
        )}
      </div>
    </>
  );
}
