import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

interface ProductImage {
  url: string;
}

interface Fabric {
  name: string;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  color: string;
  fabric?: Fabric;
  images: ProductImage[];
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  productId: string;
  product: Product; // Directly attached to OrderItem
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading order details...
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Order not found or you don’t have permission to view it.
      </div>
    );

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-light tracking-tight text-black mb-12">
          Order Details
        </h1>

        {/* Order Info */}
        <div className="border border-neutral-300 rounded-2xl p-8 flex flex-col gap-2 text-sm text-neutral-700 mb-12">
          <p className="font-medium text-black">
            Order ID: <span className="font-normal">{order.id}</span>
          </p>
          <p>
            Placed on{" "}
            <span className="text-black">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
          <p>
            Payment Method:{" "}
            <span className="text-black font-medium">{order.paymentMethod}</span>
          </p>
          <p>
            Total Amount:{" "}
            <span className="text-black font-semibold">
              ₹{order.total.toLocaleString()}
            </span>
          </p>
          <p>
            Status: <span className="text-black font-medium">{order.status}</span>
          </p>
        </div>

        {/* Items */}
        <div className="border-t border-neutral-200 pt-8 space-y-6">
          <h2 className="text-lg font-medium text-black mb-4">
            Ordered Items
          </h2>

          {order.orderItems.map((item) => {
            const product = item.product;
            const image = product?.images?.[0]?.url || "/placeholder.png";
            return (
              <div
                key={item.id}
                className="border border-neutral-200 rounded-xl p-6 flex items-center gap-6"
              >
                <div className="w-24 h-24 bg-gray-100 overflow-hidden rounded-lg flex-shrink-0 border border-neutral-200">
                  <img
                    src={image}
                    alt={product?.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col gap-1 text-sm text-neutral-700">
                  <p className="font-medium text-black">{product?.name}</p>
                  {product?.color && (
                    <p className="text-neutral-500">Color: {product.color}</p>
                  )}
                  {product?.fabric?.name && (
                    <p className="text-neutral-500">Fabric: {product.fabric.name}</p>
                  )}
                  <p className="text-neutral-500">Quantity: {item.quantity}</p>
                  <p className="text-neutral-500">
                    Price: ₹{item.priceAtPurchase.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-12">
          <motion.button
            onClick={() => router.push(`/order-tracking/${order.id}`)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.35 }}
            className="border border-black text-black text-sm px-6 py-2 rounded-full hover:bg-black hover:text-white transition-all duration-350 cursor-pointer"
          >
            Track Order
          </motion.button>

          <motion.button
            onClick={() => router.push("/orders")}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.35 }}
            className="border border-black text-black text-sm px-6 py-2 rounded-full hover:bg-black hover:text-white transition-all duration-350 cursor-pointer"
          >
            Back to Orders
          </motion.button>
        </div>
      </div>
    </div>
  );
}