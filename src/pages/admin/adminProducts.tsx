import { useEffect, useState } from "react";
import ProductForm from "@/components/productForm";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronUp, Edit2, Trash2, Package, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Match the full API response structure
interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: { url: string; isPrimary: boolean }[];
  fabric?: { 
    id: string; 
    name: string; 
    categoryId: string;
    category?: { name: string } 
  };
  variants: { size: string; stock: number; price: number }[];
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Track expanded cards by ID
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // --- PROGRESS MODAL STATE ---
  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    title: string;
    progress: number;
    total: number;
    logs: { message: string; type: "info" | "success" | "error" }[];
    isFinished: boolean;
  }>({
    isOpen: false,
    title: "",
    progress: 0,
    total: 0,
    logs: [],
    isFinished: false,
  });

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    setProgressModal(prev => ({ ...prev, logs: [...prev.logs, { message, type }] }));
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newProduct = await res.json();
      setProducts((prev) => [newProduct, ...prev]);
      setEditingProduct(newProduct);
    } else {
      throw new Error("Failed to create product");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingProduct) return;
    const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(updated);
    } else {
      throw new Error("Failed to update product");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSyncAll = async () => {
    if(!confirm("Are you sure you want to sync ALL products to Shopify? This may take a while.")) return;
    setProgressModal({ isOpen: true, title: "Syncing All Products", progress: 0, total: products.length, logs: [], isFinished: false });
    addLog(`Initiating bulk sync...`);
    try {
      const res = await fetch("/api/shopify/sync/all-products", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addLog(`✅ Bulk sync completed in ${data.duration}!`, "success");
        addLog(`Successfully synced: ${data.successCount}`, "success");
        if (data.failureCount > 0) {
          addLog(`❌ Failed to sync: ${data.failureCount}`, "error");
          data.failures.forEach((f: any) => addLog(`- ${f.name}: ${f.error}`, "error"));
        }
      } else {
        addLog(`❌ Bulk sync failed: ${data.error}`, "error");
      }
    } catch (err: any) {
      addLog(`❌ Sync failed: ${err.message}`, "error");
    } finally {
      setProgressModal(prev => ({ ...prev, progress: products.length, isFinished: true }));
    }
  };

  if (status === "loading") return <div className="p-8">Loading...</div>;
  if (!session?.user?.isAdmin) return <div className="p-8 text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">{products.length} items in catalog</p>
        </div>
        <div className="flex gap-2">
          <button 
             onClick={handleSyncAll}
             className="bg-brand-olive text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-olive/90 transition-colors"
          >
             Sync All to Shopify
          </button>
          {!showForm && (
             <button 
               onClick={() => {
                 setEditingProduct(null);
                 setShowForm(true);
               }}
               className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
             >
               + Add Product
             </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {showForm ? (
          <ProductForm
            initialData={editingProduct || undefined}
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            onCancel={() => {
              setEditingProduct(null);
              setShowForm(false);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const isExpanded = expandedIds.has(product.id);
              const mainImage = product.images?.[0]?.url || "https://placehold.co/400";
              const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* TOP ROW: Image + Basic Info + Actions (Always Visible) */}
                  <div className="p-3 flex gap-3 items-start relative">
                     {/* Thumbnail */}
                     <div 
                        onClick={() => toggleExpand(product.id)}
                        className="w-20 h-24 bg-gray-100 rounded-lg flex-shrink-0 cursor-pointer overflow-hidden"
                      >
                        <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                     </div>

                     {/* Content */}
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <h3 className="font-bold text-gray-900 truncate pr-6">{product.name}</h3>
                           {/* STICKY ACTIONS */}
                           <div className="flex gap-1">
                              <button 
                                onClick={() => { setEditingProduct(product); setShowForm(true); }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">₹{product.basePrice}</p>
                        <p className="text-xs text-gray-500 mt-1">{product.fabric?.category?.name || "Uncategorized"}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                           <div className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${totalStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              <Package size={12} /> {totalStock} in stock
                           </div>
                           <button onClick={() => toggleExpand(product.id)} className="ml-auto text-gray-400 hover:text-black">
                              {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* EXPANDABLE DETAILS */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50 border-t border-gray-100"
                      >
                        <div className="p-4 space-y-3 text-sm">
                           <div>
                              <span className="font-semibold text-gray-900 block mb-1">Description</span>
                              <p className="text-gray-600 leading-relaxed">{product.description}</p>
                           </div>
                           <div>
                              <span className="font-semibold text-gray-900 block mb-2">Variants Inventory</span>
                              <div className="grid grid-cols-4 gap-2">
                                 {product.variants.map((v, i) => (
                                    <div key={i} className="bg-white border rounded p-2 text-center">
                                       <div className="font-bold">{v.size}</div>
                                       <div className={`text-xs ${v.stock < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                          {v.stock} left
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <div className="text-xs text-gray-400 pt-2">
                              Fabric ID: {product.fabric?.id}
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {progressModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                {!progressModal.isFinished && <RefreshCw size={14} className="animate-spin text-indigo-600" />}
                {progressModal.title}
              </h2>
              {progressModal.isFinished && (
                <button onClick={() => setProgressModal(prev => ({...prev, isOpen: false}))} className="text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                <span>Progress</span>
                <span>{progressModal.progress} / {progressModal.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressModal.total > 0 ? (progressModal.progress / progressModal.total) * 100 : 100}%` }} 
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-900 text-gray-300 font-mono text-[10px] sm:text-xs space-y-1.5">
              {progressModal.logs.map((log, idx) => (
                <div key={idx} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
                  {log.message}
                </div>
              ))}
            </div>

            {progressModal.isFinished && (
              <div className="p-3 border-t border-gray-100 bg-gray-50 text-right">
                <button 
                  onClick={() => setProgressModal(prev => ({...prev, isOpen: false}))}
                  className="bg-black text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-neutral-800 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}