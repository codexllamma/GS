import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [address, setAddress] = useState({
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal: "",
  country: "India",
  });

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
        setCartItems(data.items || data); // handle both {items:[]} or []
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
    if (!address) {
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
          name: "Your Store",
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
            name: session?.user?.name,
            email: session?.user?.email,
          },
          theme: { color: "#000000" },
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

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600">
        Please log in to continue checkout.
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500">
        Loading checkout...
      </div>
    );

  const total = cartItems.reduce(
    (sum, item) =>
      sum + item.quantity * (item.product?.price || item.variant?.product?.basePrice || 0),
    0
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => router.push("/cart")}
            className="inline-flex items-center text-neutral-600 hover:text-black transition-colors text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Cart
          </button>
          <h1 className="text-4xl font-light text-neutral-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12">
          {/* LEFT — Address & Payment */}
          <div className="space-y-10">
            {/* Address Section */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-medium text-neutral-900 mb-6">Shipping Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <input
                type="text"
                placeholder="Address line 1"
                className="w-full border border-neutral-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-black"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              />
              <input
                type="text"
                placeholder="Address line 2"
                className="w-full border border-neutral-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-black"
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-5 mb-5">
              <input
                type="text"
                placeholder="City"
                className="border border-neutral-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-black"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
              <input
                type="text"
                placeholder="State"
                className="border border-neutral-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-black"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              />
              <input
                type="text"
                placeholder="Postal Code"
                className="border border-neutral-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-black"
                value={address.postal}
                onChange={(e) => setAddress({ ...address, postal: e.target.value })}
              />
            </div>

            <input
              type="text"
              placeholder="Country"
              className="w-full border border-neutral-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-black"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
            />
          </section>


            {/* Payment Section */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-medium text-neutral-900 mb-6">
                Payment Method
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 border border-neutral-300 rounded-md p-3 cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <span className="text-sm text-neutral-800">Cash on Delivery</span>
                </label>
                <label className="flex items-center gap-3 border border-neutral-300 rounded-md p-3 cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    name="payment"
                    value="RAZORPAY"
                    checked={paymentMethod === "RAZORPAY"}
                    onChange={() => setPaymentMethod("RAZORPAY")}
                  />
                  <span className="text-sm text-neutral-800">Pay Online (Razorpay)</span>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCheckout}
                className="mt-8 w-full bg-black text-white py-4 rounded-[3px] font-medium tracking-wide hover:opacity-90 transition-all duration-400"
              >
                Confirm & Pay
              </motion.button>
            </section>
          </div>

          {/* RIGHT — Order Summary */}
          <aside className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm h-fit sticky top-20">
            <h2 className="text-2xl font-medium text-neutral-900 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">
              {cartItems.length === 0 ? (
                <p className="text-sm text-neutral-600">Your cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-neutral-200 pb-4"
                  >
                    <img
                      src={
                        item.product?.image ||
                        item.variant?.product?.images?.[0]?.url ||
                        "/placeholder.png"
                      }
                      alt={item.product?.name || item.variant?.product?.name}
                      className="w-20 h-24 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {item.product?.name || item.variant?.product?.name}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Size: {item.variant?.size ?? "-"} × {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-neutral-800 mt-1">
                        ₹
                        {(
                          item.quantity *
                          (item.product?.price ||
                            item.variant?.product?.basePrice ||
                            0)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr className="border-neutral-200 mb-4" />

            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-neutral-900 font-semibold text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
