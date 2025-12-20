import { useEffect, useState } from "react";
import ProductForm from "@/components/productForm";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronUp, Edit2, Trash2, Package } from "lucide-react";
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
      setShowForm(false);
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
      setEditingProduct(null);
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
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
        {!showForm && (
           <button 
             onClick={() => setShowForm(true)}
             className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800"
           >
             + Add Product
           </button>
        )}
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
    </div>
  );
}