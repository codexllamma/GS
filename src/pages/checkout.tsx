import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthModal } from "@/store/useAuthModal";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { open: openAuthModal } = useAuthModal();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");

  /* ===============================
     AUTH GATE — PAGE LEVEL
     =============================== */
  useEffect(() => {
    if (status === "unauthenticated") {
      localStorage.setItem("redirectIntent", "/checkout");
      openAuthModal();
    }
  }, [status, openAuthModal]);

  /* ===============================
     LOAD CART + ADDRESS (AUTH ONLY)
     =============================== */
  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadData() {
      try {
        const cartRes = await fetch("/api/cart");
        const cartData = await cartRes.json();
        setCartItems(cartData.cart?.items ?? []);

        const userRes = await fetch("/api/user");
        const user = await userRes.json();
        if (user?.address) setAddress(user.address);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [status]);

  /* ===============================
     RAZORPAY LOADER
     =============================== */
  const loadRazorpay = () =>
    new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });

  /* ===============================
     CHECKOUT HANDLER (HARD GUARDED)
     =============================== */
  const handleCheckout = async () => {
    if (!session) {
      localStorage.setItem("redirectIntent", "/checkout");
      openAuthModal();
      return;
    }

    if (!address.line1 || !address.city || !address.state || !address.postal) {
      alert("Please fill in all required address fields.");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, paymentMethod }),
      });

      if (res.status === 401) {
        localStorage.setItem("redirectIntent", "/checkout");
        openAuthModal();
        return;
      }

      if (!res.ok) throw new Error("Checkout failed");

      const data = await res.json();
      const order = data.order;

      if (paymentMethod === "RAZORPAY") {
        await loadRazorpay();

        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.razorpayOrder.amount,
          currency: "INR",
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
            name: session.user?.name,
            email: session.user?.email,
          },
          theme: { color: "#000000" },
        });

        rzp.open();
      } else {
        router.push(`/order-confirmation/${order.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed.");
    }
  };

  /* ===============================
     LOADING STATE
     =============================== */
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500">
        Loading checkout…
      </div>
    );
  }

  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (item.variant?.price ??
          item.variant?.product?.basePrice ??
          0),
    0
  );

  /* ===============================
     UI
     =============================== */
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center text-sm text-neutral-600 mb-6"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to cart
        </button>

        <h1 className="text-3xl font-light mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-10">
          {/* LEFT */}
          <div className="space-y-8">
            {/* Address */}
            <section className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-medium mb-4">Shipping Address</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  placeholder="Address line 1 *"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className="border p-3 rounded"
                />
                <input
                  placeholder="Address line 2"
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  className="border p-3 rounded"
                />
                <input
                  placeholder="City *"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="border p-3 rounded"
                />
                <input
                  placeholder="State *"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="border p-3 rounded"
                />
                <input
                  placeholder="Postal *"
                  value={address.postal}
                  onChange={(e) => setAddress({ ...address, postal: e.target.value })}
                  className="border p-3 rounded"
                />
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-medium mb-4">Payment Method</h2>

              <label className="flex gap-2 items-center mb-3">
                <input
                  type="radio"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on Delivery
              </label>

              <label className="flex gap-2 items-center">
                <input
                  type="radio"
                  checked={paymentMethod === "RAZORPAY"}
                  onChange={() => setPaymentMethod("RAZORPAY")}
                />
                Pay Online (Razorpay)
              </label>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                className="mt-6 w-full bg-black text-white py-3 rounded"
              >
                Confirm & Pay
              </motion.button>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="bg-white p-6 rounded-xl border h-fit">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>

            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between mb-3 text-sm">
                <span>
                  {item.variant?.product?.name} × {item.quantity}
                </span>
                <span>
                  ₹
                  {(
                    item.quantity *
                    (item.variant?.price ??
                      item.variant?.product?.basePrice ??
                      0)
                  ).toLocaleString()}
                </span>
              </div>
            ))}

            <hr className="my-4" />

            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
