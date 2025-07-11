
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div className="p-4">Loading your orders...</div>;

  if (!orders.length)
    return <div className="p-4">You have not placed any orders yet.</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Your Orders</h1>
      <table className="min-w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-black text-white">
            <th className="border p-2">Order ID</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="border p-2">{order.id}</td>
              <td className="border p-2">{order.status}</td>
              <td className="border p-2">₹{order.total}</td>
              <td className="border p-2">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="border p-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

