import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function CheckoutPage() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return <p>Please log in to continue checkout.</p>;
  }
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);

  const loadRazorpay = (): Promise<void> =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
    
  useEffect(() => {
    
    
    
    const fetchCart = async () => {
      if (status !== "authenticated") return;
      try {
        const res = await fetch("/api/cart");
        const data = await res.json();
        setCartItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserAddress = async () => {
      if (status !== "authenticated") return;
      try {
        const res = await fetch("/api/user");
        const user = await res.json();
        if (user.address) setAddress(user.address);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCart();
    fetchUserAddress();
  }, [status]);
  
   
  const handleCheckout = async () => {
    
    if (!address.trim()) {
      alert("Please enter a valid address.");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, paymentMethod }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const data = await res.json();
      const order = data.order;

      
      if (paymentMethod === "RAZORPAY") {
        await loadRazorpay();
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: "Your Shop Name",
          description: "Order Payment",
          order_id: data.razorpayOrder.id,
          handler: async (response: any) => {
            await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            router.push(`/order-confirmation/${order.id}`);
          },
          prefill: {
            name: session.user?.name,
            email: session.user?.email,
            contact: "", // optional
          },
          theme: { color: "#F37254" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        router.push(`/order-confirmation/${order.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed.");
    }
  };

  
  if (loading) return <p>Loading checkout...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Shipping Address</h2>
        {!address && (
          <p className="text-sm text-gray-600">
            No address found. Please enter your address.
          </p>
        )}
        <textarea
          className="w-full border p-2 mt-2"
          rows={4}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your shipping address"
        />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Payment Method</h2>
        <select
          className="w-full border p-2 mt-2"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="COD">Cash on Delivery</option>
          <option value="RAZORPAY">Online</option>
        </select>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        {cartItems.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          <ul className="border p-4">
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between mb-2">
                <span>{item.product?.name} × {item.quantity}</span>
                <span>₹{item.product?.price * item.quantity}</span>
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </li>
              
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>
                ₹
                {cartItems.reduce(
                  (total, item) => total + item.product?.price * item.quantity,
                  0
                )}
              </span>
            </div>
          </ul>
        )}
      </div>

      <button
        type="button"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        onClick={handleCheckout}
      >
        Confirm Order
      </button>
    </div>
  );
}
