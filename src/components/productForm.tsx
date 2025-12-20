import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Upload } from "lucide-react";

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

interface Category { id: string; name: string; }
interface Fabric { id: string; name: string; categoryId: string; }
interface Variant { size: string; price: string; stock: string; }

export default function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  // --- FORM STATE ---
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    color: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFabric, setSelectedFabric] = useState<string>("");
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [variants, setVariants] = useState<Variant[]>([]);

  // --- 1. POPULATE FORM IF EDITING (The Fix) ---
  useEffect(() => {
    if (initialData) {
      // Map basic fields
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        basePrice: initialData.basePrice ? String(initialData.basePrice) : "",
        color: initialData.color || "",
      });

      // Map Images (Extract URLs)
      if (initialData.images && Array.isArray(initialData.images)) {
        setUploadedImages(initialData.images.map((img: any) => img.url));
      }

      // Map Variants
      if (initialData.variants && Array.isArray(initialData.variants)) {
        setVariants(initialData.variants.map((v: any) => ({
          size: v.size,
          price: String(v.price || initialData.basePrice), // fallback to base
          stock: String(v.stock || 0)
        })));
      }

      // Map Category & Fabric
      // Note: We need the fabric object to know the category
      if (initialData.fabric) {
        setSelectedFabric(initialData.fabric.id);
        if (initialData.fabric.categoryId) {
          setSelectedCategory(initialData.fabric.categoryId);
        }
      } else if (initialData.fabricId) {
        // Fallback if relation not fetched but ID exists
        setSelectedFabric(initialData.fabricId);
      }
    }
  }, [initialData]);

  // --- FETCH OPTIONS ---
  useEffect(() => {
    fetch("/api/categories").then(res => res.json()).then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    fetch(`/api/fabrics?categoryId=${selectedCategory}`)
      .then(res => res.json())
      .then(setFabrics)
      .catch(console.error);
  }, [selectedCategory]);

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage.from("images").upload(filePath, file);
        if (error) throw error;

        const { data } = supabase.storage.from("images").getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }
      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVariant = (size: string) => {
    setVariants(prev => {
      const exists = prev.find(v => v.size === size);
      if (exists) return prev.filter(v => v.size !== size);
      return [...prev, { size, price: form.basePrice, stock: "0" }];
    });
  };

  const updateVariant = (size: string, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map(v => v.size === size ? { ...v, [field]: value } : v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      basePrice: Number(form.basePrice),
      fabricId: selectedFabric,
      images: uploadedImages, // Array of strings
      variants: variants.map(v => ({
        size: v.size,
        price: Number(v.price),
        stock: Number(v.stock)
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{initialData ? "Edit Product" : "New Product"}</h2>
        {onCancel && <button type="button" onClick={onCancel}><X size={20}/></button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" className="w-full border p-2 rounded" required />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={4} className="w-full border p-2 rounded" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} placeholder="Base Price (₹)" className="border p-2 rounded" required />
            <input name="color" value={form.color} onChange={handleChange} placeholder="Color" className="border p-2 rounded" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border p-2 rounded" required>
               <option value="">Select Category</option>
               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <select value={selectedFabric} onChange={e => setSelectedFabric(e.target.value)} className="border p-2 rounded" disabled={!selectedCategory} required>
               <option value="">Select Fabric</option>
               {fabrics.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
             </select>
          </div>
        </div>

        {/* Right Column: Images & Variants */}
        <div className="space-y-6">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-2">Images</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {uploadedImages.map((url, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={url} alt="upload" className="w-full h-full object-cover rounded border" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                    <X size={12}/>
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 aspect-square">
                 <Upload size={20} className="text-gray-400"/>
                 <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading}/>
              </label>
            </div>
            {uploading && <p className="text-xs text-blue-500 animate-pulse">Uploading...</p>}
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-medium mb-2">Sizes & Stock</label>
            <div className="flex flex-wrap gap-3">
              {["S", "M", "L", "XL", "XXL"].map(size => {
                const isActive = variants.some(v => v.size === size);
                const variant = variants.find(v => v.size === size);
                return (
                  <div key={size} className={`border rounded p-2 ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input type="checkbox" checked={isActive} onChange={() => toggleVariant(size)} />
                      <span className="font-semibold text-sm">{size}</span>
                    </label>
                    {isActive && (
                      <div className="flex gap-1">
                         <input type="number" placeholder="Price" value={variant?.price} onChange={e => updateVariant(size, "price", e.target.value)} className="w-16 p-1 text-xs border rounded" />
                         <input type="number" placeholder="Qty" value={variant?.stock} onChange={e => updateVariant(size, "stock", e.target.value)} className="w-12 p-1 text-xs border rounded" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end gap-3">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>}
        <button type="submit" disabled={uploading} className="bg-black text-white px-6 py-2 rounded hover:bg-neutral-800 transition">
          {initialData ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}