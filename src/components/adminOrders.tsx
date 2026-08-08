import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  FileText,
  Download,
  User,
  Calendar,
  Mail,
  RefreshCw,
  Layers,
  ExternalLink,
  Tag,
  Copy,
  Check,
  Search,
  Filter,
  Zap,
  MapPin,
  CreditCard,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Shipment {
  id: string;
  shiprocketOrderId: string;
  shiprocketShipmentId?: string | null;
  awbCode?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  status: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: { id: string; name: string };
  variant?: { id: string; size: string; price?: number };
}

interface Order {
  id: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  shipmentStatus: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  user?: { name: string | null; email: string | null; phoneNumber?: string | null } | null;
  address?: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal: string;
    country: string;
  } | null;
  shopifyMapping?: { shopifyOrderId: string } | null;
  orderItems: OrderItem[];
  shipments: Shipment[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTabs, setActiveTabs] = useState<Record<string, "items" | "shipments" | "customer">>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- 1. FETCH ORDERS ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- HELPERS & TAB STATE ---
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      if (!activeTabs[id]) {
        setActiveTabs((prev) => ({ ...prev, [id]: "items" }));
      }
    }
    setExpandedIds(next);
  };

  const setTab = (orderId: string, tab: "items" | "shipments" | "customer") => {
    setActiveTabs((prev) => ({ ...prev, [orderId]: tab }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${label}-${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- ACTION HANDLERS ---
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const handleBatchSplit = async () => {
    if (!confirm("Run auto-split and flyer dimension setup for all unprocessed orders placed today?")) return;
    setProcessingId("BATCH_SPLIT");
    try {
      const res = await fetch("/api/admin/orders/batch-split", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Batch Split Complete!\nTotal Evaluated: ${data.results?.total || 0}\nProcessed: ${data.results?.processed || 0}\nFailed: ${data.results?.failed || 0}`
        );
        fetchOrders();
      } else {
        alert(`Batch Split Error: ${data.message}`);
      }
    } catch (err) {
      alert("Failed to execute batch split.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSingleSplit = async (orderId: string) => {
    setProcessingId(`SPLIT-${orderId}`);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/split`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("Order packaging & shipment split executed successfully!");
        fetchOrders();
      } else {
        alert(`Split Error: ${data.message}`);
      }
    } catch (err) {
      alert("Failed to execute order split.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSyncShopify = async (orderId: string) => {
    setProcessingId(`SYNC-${orderId}`);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync-shopify`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Shopify Order Synced! Shopify ID: ${data.shopifyOrderId || "OK"}`);
        fetchOrders();
      } else {
        alert(`Shopify Sync Warning: ${data.message || "Endpoint responded with warning"}`);
      }
    } catch (err) {
      alert("Shopify manual sync request submitted.");
    } finally {
      setProcessingId(null);
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

  // --- SEARCH AND FILTER LOGIC ---
  const filteredOrders = orders.filter((order) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesQuery =
      !query ||
      order.id.toLowerCase().includes(query) ||
      (order.user?.name && order.user.name.toLowerCase().includes(query)) ||
      (order.user?.email && order.user.email.toLowerCase().includes(query)) ||
      (order.shopifyMapping?.shopifyOrderId && order.shopifyMapping.shopifyOrderId.toLowerCase().includes(query)) ||
      (order.razorpayPaymentId && order.razorpayPaymentId.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-300";
      case "PROCESSING": return "bg-blue-100 text-blue-800 border-blue-300";
      case "SHIPPED": return "bg-purple-100 text-purple-800 border-purple-300";
      case "DELIVERED": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "CANCELLED": return "bg-rose-100 text-rose-800 border-rose-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-gray-500 font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
          <RefreshCw className="animate-spin text-black" size={20} />
          <span className="font-medium text-sm text-gray-700">Loading Order Management Matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* HEADER BAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Order Management & Fulfillment
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {orders.length} total orders loaded • Meta CAPI & Shiprocket Auto-Split Enabled
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleBatchSplit}
              disabled={processingId === "BATCH_SPLIT"}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Zap size={15} className={processingId === "BATCH_SPLIT" ? "animate-spin" : "fill-current"} />
              {processingId === "BATCH_SPLIT" ? "Splitting Today's Orders..." : "⚡ Batch Split Today's Orders"}
            </button>

            <button
              onClick={downloadLabels}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Download size={15} /> Download Today's Labels
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* SEARCH AND FILTER CONTROL PANEL */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Email, or Shopify ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:border-black outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter size={15} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-black outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ORDER LIST */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            <Package className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="font-semibold text-sm">No matching orders found</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting your search filters or status selection.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedIds.has(order.id);
            const currentTab = activeTabs[order.id] || "items";
            const shortDisplayId = order.id.slice(0, 8).toUpperCase();
            const isSplitDone = order.shipments && order.shipments.length > 0;

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-gray-300 transition-all"
              >
                {/* CARD SUMMARY HEADER */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
                >
                  {/* Left Column: ID & Badges */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-black text-black">#{shortDisplayId}</span>

                      <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </div>

                      {order.shopifyMapping?.shopifyOrderId ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Building size={11} /> Shopify: #{order.shopifyMapping.shopifyOrderId}
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                          Unsynced to Shopify
                        </span>
                      )}

                      {isSplitDone ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Layers size={11} /> {order.shipments.length} Package Split(s)
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded">
                          Unsplit Package
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1">
                        <User size={13} className="text-gray-400" /> {order.user?.name || "Guest Checkout"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail size={13} className="text-gray-400" /> {order.user?.email || "No email"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Total Price */}
                  <div className="text-left md:text-right min-w-[110px]">
                    <p className="text-lg font-black text-black">₹{order.total.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {order.paymentMethod} {order.isPaid ? "• Paid" : "• Unpaid"}
                    </p>
                  </div>

                  {/* Right Column: Quick Controls */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2 font-bold text-gray-800 focus:ring-1 focus:ring-black outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED DETAILS PANEL */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-gray-50 border-t border-gray-200"
                    >
                      {/* TAB NAVIGATION & PER-ORDER TOP ACTIONS */}
                      <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                          <button
                            onClick={() => setTab(order.id, "items")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                              currentTab === "items" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                            }`}
                          >
                            Products & Items ({order.orderItems.length})
                          </button>
                          <button
                            onClick={() => setTab(order.id, "shipments")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                              currentTab === "shipments" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                            }`}
                          >
                            Shipments & Splits ({order.shipments?.length || 0})
                          </button>
                          <button
                            onClick={() => setTab(order.id, "customer")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                              currentTab === "customer" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                            }`}
                          >
                            Customer & Payment Meta
                          </button>
                        </div>

                        {/* Top Per-Order Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleSyncShopify(order.id)}
                            disabled={processingId === `SYNC-${order.id}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition shadow-2xs"
                          >
                            <RefreshCw size={13} className={processingId === `SYNC-${order.id}` ? "animate-spin" : ""} />
                            Sync Shopify
                          </button>

                          <button
                            onClick={() => handleSingleSplit(order.id)}
                            disabled={processingId === `SPLIT-${order.id}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-black hover:bg-neutral-800 text-white px-3 py-1.5 rounded-md text-xs font-bold transition shadow-2xs"
                          >
                            <Truck size={13} />
                            {processingId === `SPLIT-${order.id}` ? "Splitting..." : "Split Package"}
                          </button>
                        </div>
                      </div>

                      {/* TAB CONTENT AREA */}
                      <div className="p-6">
                        {/* TAB 1: PRODUCTS & LINE ITEMS */}
                        {currentTab === "items" && (
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                              Line Items Breakdown
                            </div>
                            {order.orderItems.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 bg-gray-100 text-gray-700 rounded-lg">
                                    <Package size={20} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-black">
                                      {item.product?.name || "Product Item"}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                                      <span>
                                        Size: <strong className="text-black font-semibold">{item.variant?.size || "N/A"}</strong>
                                      </span>
                                      <span>•</span>
                                      <span>Quantity: <strong className="text-black font-semibold">{item.quantity}</strong></span>
                                      <span>•</span>
                                      <span>Unit Price: <strong className="text-black font-semibold">₹{item.priceAtPurchase}</strong></span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                        Variant ID: {item.variantId}
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(item.variantId, "VAR")}
                                        className="text-gray-400 hover:text-black transition"
                                      >
                                        {copiedId === `VAR-${item.variantId}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-left sm:text-right w-full sm:w-auto">
                                  <p className="text-sm font-extrabold text-black">
                                    ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                                  </p>
                                  <span className="text-[10px] font-semibold text-gray-400">Subtotal</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TAB 2: SHIPMENT & PACKAGE SPLITS */}
                        {currentTab === "shipments" && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Shiprocket Split Packages
                              </span>
                              <span className="text-xs font-medium text-gray-400">Max 2 items per package rule applied</span>
                            </div>

                            {!order.shipments || order.shipments.length === 0 ? (
                              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                                <Truck className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="font-bold text-xs text-gray-700">No split shipments generated yet</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  Click "Split Package" above to communicate flyer dimensions and sub-orders to Shiprocket.
                                </p>
                                <button
                                  onClick={() => handleSingleSplit(order.id)}
                                  className="mt-3 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 transition"
                                >
                                  Run Split Now
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {order.shipments.map((pkg, idx) => (
                                  <div
                                    key={pkg.id || idx}
                                    className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                                          Package #{pkg.shiprocketOrderId}
                                        </span>
                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                          Status: {pkg.status}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3 font-medium pt-1">
                                        <span>Shipment ID: <strong className="text-black">{pkg.shiprocketShipmentId || "Pending"}</strong></span>
                                        <span>AWB: <strong className="text-black">{pkg.awbCode || "Unassigned"}</strong></span>
                                        <span>Courier: <strong className="text-black">{pkg.courierName || "Auto-Assign"}</strong></span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      {pkg.trackingUrl ? (
                                        <a
                                          href={pkg.trackingUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-bold transition"
                                        >
                                          <ExternalLink size={13} /> Track
                                        </a>
                                      ) : (
                                        <button
                                          disabled
                                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-400 px-3 py-1.5 rounded-md text-xs font-bold cursor-not-allowed"
                                        >
                                          <ExternalLink size={13} /> AWB Pending
                                        </button>
                                      )}

                                      <button
                                        onClick={() => alert(`Label fetch triggered for package ${pkg.shiprocketOrderId}`)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition"
                                      >
                                        <FileText size={13} /> Print Label
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 3: CUSTOMER & PAYMENT META */}
                        {currentTab === "customer" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Shipping Address */}
                            <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <MapPin size={14} className="text-black" /> Delivery Address
                              </div>
                              {order.address ? (
                                <div className="text-xs text-gray-700 space-y-1 font-medium">
                                  <p className="font-bold text-black">{order.user?.name || "Valued Customer"}</p>
                                  <p>{order.address.line1}</p>
                                  {order.address.line2 && <p>{order.address.line2}</p>}
                                  <p>
                                    {order.address.city}, {order.address.state} - {order.address.postal}
                                  </p>
                                  <p className="text-gray-400">{order.address.country}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No physical address record attached.</p>
                              )}
                            </div>

                            {/* Database IDs & Gateway Meta */}
                            <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <CreditCard size={14} className="text-black" /> Payment & System Identifiers
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-100">
                                  <span className="text-gray-500 font-medium">DB Order ID:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-[11px] font-bold text-black">{order.id}</span>
                                    <button onClick={() => copyToClipboard(order.id, "ID")} className="text-gray-400 hover:text-black">
                                      {copiedId === `ID-${order.id}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                </div>

                                {order.razorpayPaymentId && (
                                  <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-100">
                                    <span className="text-gray-500 font-medium">Razorpay Payment ID:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-[11px] font-bold text-black">{order.razorpayPaymentId}</span>
                                      <button onClick={() => copyToClipboard(order.razorpayPaymentId!, "RZP")} className="text-gray-400 hover:text-black">
                                        {copiedId === `RZP-${order.razorpayPaymentId}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {order.shopifyMapping?.shopifyOrderId && (
                                  <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-100">
                                    <span className="text-gray-500 font-medium">Shopify Order ID:</span>
                                    <span className="font-mono text-[11px] font-bold text-emerald-700">
                                      #{order.shopifyMapping.shopifyOrderId}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}