"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  images: ProductImage[];
}

interface ProductVariant {
  id: string;
  size: string;
  product: Product;
}

interface OrderItem {
  id: string;
  quantity: number;
  variant: ProductVariant;
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  orderItems: OrderItem[];
}


export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/orders");
        setOrders(res.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your orders...
      </div>
    );

  if (!orders.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p className="text-base font-medium">You have not placed any orders yet.</p>
        <Link
          href="/product/products"
          className="mt-6 border border-black px-6 py-2.5 rounded-full hover:bg-black hover:text-white transition-all duration-350"
        >
          Start Shopping
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-light tracking-tight text-black mb-12">
          Your Orders
        </h1>

        <div className="space-y-8">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.35 }}
              className="border border-neutral-300 rounded-2xl p-8 flex flex-col gap-6"
            >
              {/* Order Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                <div className="flex flex-col gap-2 text-sm text-neutral-700">
                  <p className="font-medium text-black">
                    Order ID: <span className="font-normal">{order.id}</span>
                  </p>
                  <p>
                    Placed on{" "}
                    <span className="text-black">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                  <p>
                    Payment Method:{" "}
                    <span className="text-black font-medium">
                      {order.paymentMethod}
                    </span>
                  </p>
                  <p>
                    Total Amount:{" "}
                    <span className="text-black font-semibold">
                      ₹{order.total.toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Status:{" "}
                    <span className="text-black font-medium">{order.status}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-0">
                  <Link
                    href={`/order-tracking/${order.id}`}
                    className="border border-black text-black text-sm px-5 py-2 rounded-full hover:bg-black hover:text-white transition-all duration-350"
                  >
                    Track Order
                  </Link>
                  <Link
                    href={`/orders/${order.id}`}
                    className="border border-black text-black text-sm px-5 py-2 rounded-full hover:bg-black hover:text-white transition-all duration-350"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {/* Product Overview */}
              {order.orderItems?.length > 0 && (
                <div className="border-t border-neutral-200 pt-6 mt-2 space-y-4">
                  <p className="text-sm font-medium text-neutral-600 mb-3">
                    Ordered Items
                  </p>
                  <div className="flex flex-col gap-5">
                    {order.orderItems.map((item) => {
                      const product = item.variant?.product;
                      const image =
                        product?.images[0]?.url || "/placeholder.png";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-5 border border-neutral-200 rounded-xl p-4"
                        >
                          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <img
                              src={image}
                              alt={product?.name || "Product image"}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex flex-col text-sm text-neutral-700">
                            <p className="font-medium text-black">{product?.name}</p>
                            <p className="text-neutral-500">
                              Size: {item.variant?.size}
                            </p>
                            <p className="text-neutral-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
