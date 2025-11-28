import { useEffect, useState } from "react";
import axios from "axios";

interface AdminOrdersProps {}

export default function AdminOrders({}: AdminOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const toggleExpand = (orderId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">All Orders (Admin)</h1>

        {/* 🔥 Download all labels for today */}
        <button
          onClick={async () => {
            try {
              const res = await axios.get("/api/admin/labels/download-today", {
                responseType: "blob",
              });

              const blob = new Blob([res.data], { type: "application/zip" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `labels-${new Date().toISOString().slice(0, 10)}.zip`;
              a.click();
            } catch (err) {
              console.error(err);
              alert("Failed to download labels.");
            }
          }}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          Download All Labels (Today)
        </button>
      </div>

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-black text-white">
            <th className="border p-2">Order ID</th>
            <th className="border p-2">User</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Ordered At</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <>
              {/* 🔥 MAIN ROW (CLICKABLE) */}
              <tr
                key={order.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(order.id)}
              >
                <td className="border p-2 font-semibold text-blue-600 underline">
                  {order.id}
                </td>
                <td className="border p-2">{order.user?.name || "N/A"}</td>
                <td className="border p-2">{order.user?.email || "N/A"}</td>
                <td className="border p-2">
                  <select
                    className="border rounded p-1 text-sm"
                    value={order.status}
                    onClick={(e) => e.stopPropagation()}
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
                  {new Date(order.createdAt).toLocaleString()}
                </td>
              </tr>

              {/* 🔥 EXPANDED ROW: SHOW ITEMS */}
              {expanded[order.id] && (
                <tr>
                  <td colSpan={7} className="bg-gray-100 p-4 border-b">
                    <h3 className="font-semibold mb-2">Products</h3>

                    {order.orderItems.flatMap((item: any) =>
                      Array.from({ length: item.quantity }).map((_, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className="flex justify-between items-center bg-white border p-3 mb-2 rounded"
                        >
                          <div>
                            <div className="font-semibold">
                              {item.product?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              Variant: {item.variant?.size} | Quantity Unit: 1
                            </div>
                          </div>

                          <div className="flex gap-3">
                            {/* CREATE SHIPMENT */}
                            <button
                              className="px-3 py-1 bg-yellow-600 text-white rounded"
                              onClick={async () => {
                                try {
                                  const res = await axios.post(
                                    "/api/admin/shipments/create",
                                    {
                                      orderId: order.id,
                                      orderItemId: item.id,
                                      sequenceIndex: idx,
                                    }
                                  );
                                  alert("Shipment created.");
                                } catch (err) {
                                  console.error(err);
                                  alert("Failed to create shipment.");
                                }
                              }}
                            >
                              Create Shipment
                            </button>

                            {/* CREATE LABEL */}
                            <button
                              className="px-3 py-1 bg-green-700 text-white rounded"
                              onClick={async () => {
                                try {
                                  const res = await axios.post(
                                    "/api/admin/shipments/create-label",
                                    {
                                      orderId: order.id,
                                      orderItemId: item.id,
                                      sequenceIndex: idx,
                                    }
                                  );
                                  alert("Label generated.");
                                } catch (err) {
                                  console.error(err);
                                  alert("Failed to generate label.");
                                }
                              }}
                            >
                              Create Label
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
