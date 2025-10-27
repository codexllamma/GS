import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Order, OrderItem, Product, Address } from "@/generated/prisma";

type OrderWithItems = Order & {
  orderItems: (OrderItem & {
    product: Product & { images: { url: string }[] };
  })[];
  address?: Address;
};

const OrderConfirmationPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your order...
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Order not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-md p-10 w-full max-w-3xl"
      >
        
        <div className="flex flex-col items-center mb-10 text-center">
          <CheckCircle2 size={56} className="text-green-500 mb-4" />
          <h1 className="text-3xl font-semibold text-gray-900">
            Order Confirmed
          </h1>
          <p className="text-gray-500 mt-2">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
            <p className="text-gray-500">Order ID</p>
            <p>{order.id}</p>

            <p className="text-gray-500">Status</p>
            <p className="font-medium text-gray-800">{order.status}</p>

            <p className="text-gray-500">Payment Method</p>
            <p>{order.paymentMethod}</p>

            <p className="text-gray-500">Total Paid</p>
            <p className="font-semibold">₹{order.total.toLocaleString()}</p>
          </div>
        </div>

        
        {order.address && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Shipping Address
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {order.address.line1}
              {order.address.line2 && `, ${order.address.line2}`} <br />
              {order.address.city}, {order.address.state} -{" "}
              {order.address.postal} <br />
              {order.address.country}
            </p>
          </div>
        )}

        
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Items in Your Order
          </h2>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.images?.[0]?.url || "/placeholder.png"}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} · ₹{item.priceAtPurchase}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  ₹{(item.quantity * item.priceAtPurchase).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>


        <div className="mt-10 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-black text-white text-sm px-5 py-3 rounded-full hover:bg-gray-800 transition-all"
          >
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;
