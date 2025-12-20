import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Package, Truck, FileText, Download, User, Calendar, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Interface for type safety (optional but good practice)
interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  orderItems: {
    id: string;
    quantity: number;
    product: { name: string };
    variant: { size: string };
  }[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // --- 1. FETCH ORDERS ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // --- HELPERS ---
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const downloadLabels = async () => {
    try {
      const res = await fetch("/api/admin/labels/download-today");
      if (!res.ok) throw new Error("Download failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `labels-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Failed to download labels.");
    }
  };

  // --- SHIPMENT ACTIONS (Per Unit) ---
  const handleShipmentAction = async (endpoint: string, payload: any) => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Action failed");
      alert("Success!");
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PROCESSING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED": return "bg-purple-100 text-purple-800 border-purple-200";
      case "DELIVERED": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-apercu">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} active orders</p>
        </div>
        <button
          onClick={downloadLabels}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-neutral-800 transition shadow-md text-sm font-medium"
        >
          <Download size={16} /> Download Today's Labels
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedIds.has(order.id);

          return (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              
              {/* --- MAIN ROW --- */}
              <div 
                onClick={() => toggleExpand(order.id)}
                className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer group"
              >
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-bold text-gray-900">#{order.id.slice(-6).toUpperCase()}</span>
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><User size={14}/> {order.user?.name || "Guest"}</div>
                    <div className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-right">
                   <p className="text-lg font-bold text-gray-900">₹{order.total}</p>
                   <p className="text-xs text-gray-400">Total Amount</p>
                </div>

                {/* Status Dropdown (Stop Propagation to prevent toggle) */}
                <div onClick={(e) => e.stopPropagation()} className="min-w-[140px]">
                   <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                   >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                   </select>
                </div>

                {/* Toggle Icon */}
                <div className="text-gray-400 group-hover:text-black transition-colors">
                   {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* --- EXPANDED DETAILS --- */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50 border-t border-gray-100"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900">
                         <Mail size={16} className="text-gray-400"/> {order.user?.email || "No Email"}
                      </div>
                      
                      <div className="space-y-3">
                         {order.orderItems.flatMap((item: any, itemIdx: number) => 
                           Array.from({ length: item.quantity }).map((_, unitIdx) => (
                             <div 
                               key={`${item.id}-${unitIdx}`} 
                               className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="p-2 bg-gray-100 rounded-md">
                                      <Package className="text-gray-600" size={24} />
                                   </div>
                                   <div>
                                      <h4 className="font-semibold text-gray-900">{item.product?.name}</h4>
                                      <p className="text-sm text-gray-500">
                                         Size: <span className="font-medium text-black">{item.variant?.size}</span> • Unit {unitIdx + 1} of {item.quantity}
                                      </p>
                                   </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                   <button
                                      onClick={() => handleShipmentAction("/api/admin/shipments/create", {
                                         orderId: order.id,
                                         orderItemId: item.id,
                                         sequenceIndex: unitIdx
                                      })}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                   >
                                      <Truck size={16} /> Ship
                                   </button>
                                   
                                   <button
                                      onClick={() => handleShipmentAction("/api/admin/shipments/create-label", {
                                         orderId: order.id,
                                         orderItemId: item.id,
                                         sequenceIndex: unitIdx
                                      })}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                   >
                                      <FileText size={16} /> Label
                                   </button>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>
    </div>
  );
}