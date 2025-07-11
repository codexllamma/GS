import { useEffect, useState } from "react";
import axios from "axios";

interface AdminOrdersProps {}

export default function AdminOrders({}: AdminOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/admin/orders");
        setOrders(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">All Orders (Admin View)</h1>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className= "bg-black">
            <th className="border p-2">Order ID</th>
            <th className="border p-2">User</th>
            <th className="border p-2">Email</th>
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
              <td className="border p-2">{order.user?.name}</td>
              <td className="border p-2">{order.user?.email}</td>
              <td className="border p-2">
                <select
                  className="border rounded p-1 text-sm"
                  value={order.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      await axios.put(`/api/admin/orders/${order.id}`, {
                        status: newStatus,
                      });
        
                      setOrders((prev) =>
                        prev.map((o) =>
                          o.id === order.id ? { ...o, status: newStatus } : o
                        )
                      );
                    } catch (error) {
                      console.error(error);
                      alert("Failed to update status.");
                    }
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </td>

              <td className="border p-2">₹{order.total}</td>
              <td className="border p-2">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="border p-2">
                <a
                  href={`/api/admin/orders/${order.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



