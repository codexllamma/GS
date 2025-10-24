import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

interface Category {
  id: string;
  name: string;
}

interface Fabric {
  id: string;
  name: string;
  categoryId: string;
}

interface Variant {
  size: string;
  price: string; 
  stock: string;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    basePrice: initialData ? String(initialData.basePrice) : "",
    color: initialData?.color || "",
    category: initialData?.category || "",
    fabric: initialData?.fabric || "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFabric, setSelectedFabric] = useState<string>("");
  const [imageCount, setImageCount] = useState<number>(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Fetch categories from DB
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch fabrics when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchFabrics = async () => {
      try {
        const res = await fetch(`/api/fabrics?categoryId=${selectedCategory}`);
        if (!res.ok) throw new Error("Failed to fetch fabrics");
        const data = await res.json();
        setFabrics(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFabrics();
  }, [selectedCategory]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image upload
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${index}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);

      setUploadedImages((prev) => {
        const newArr = [...prev];
        newArr[index] = data.publicUrl;
        return newArr;
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. Check console.");
    } finally {
      setUploading(false);
    }
  };

  // Handle variant selection toggle
  const toggleVariant = (size: string) => {
    setVariants((prev) => {
      const exists = prev.find((v) => v.size === size);
      if (exists) {
        return prev.filter((v) => v.size !== size);
      } else {
        return [...prev, { size, price: form.basePrice, stock: "" }];
      }
    });
  };
  

  // Update variant price safely
  const updateVariantField = (
    size: string,
    field: "price" | "stock",
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.size === size ? { ...v, [field]: value } : v
      )
    );
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      basePrice: Number(form.basePrice) || 0,
      images: uploadedImages.filter(Boolean),
      variants: variants.map((v) => ({
        size: v.size,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
      })),
      fabricId: selectedFabric,
    });
    
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 border rounded-lg max-w-2xl mx-auto"
    >
      {/* Product Basics */}
      <div className="grid gap-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="border p-2 w-full rounded"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="border p-2 w-full rounded"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            name="basePrice"
            value={form.basePrice}
            onChange={handleChange}
            placeholder="Enter base price"
            className="border p-2 rounded"
            required
          />
        </div>

        <input
          type="text"
          name="color"
          value={form.color}
          onChange={handleChange}
          placeholder="Color"
          className="border p-2 rounded"
          required
        />
      </div>

      {/* Category / Fabric */}
      <div className="grid grid-cols-2 gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedFabric}
          onChange={(e) => setSelectedFabric(e.target.value)}
          className="border p-2 rounded"
          required
          disabled={!selectedCategory}
        >
          <option value="">Select Fabric</option>
          {fabrics.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium mb-2">
          How many images?
        </label>
        <input
          type="number"
          min={1}
          max={8}
          value={imageCount}
          onChange={(e) => setImageCount(Number(e.target.value))}
          className="border p-2 rounded w-24"
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          {Array.from({ length: imageCount }).map((_, i) => (
            <div key={i}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, i)}
                disabled={uploading}
                className="border p-2 rounded w-full"
              />
              {uploadedImages[i] && (
                <img
                  src={uploadedImages[i]}
                  alt={`Product ${i + 1}`}
                  className="w-full h-32 object-cover mt-2 rounded"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div>
        <label className="block font-medium mb-2">Available Sizes</label>
        <div className="flex gap-4 flex-wrap">
          {["S", "M", "L", "XL"].map((size) => {
            const active = variants.some((v) => v.size === size);
            const variant = variants.find((v) => v.size === size);
            return (
              <div key={size} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleVariant(size)}
                />
                <span>{size}</span>
                {active && (
                  <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant?.price || form.basePrice}
                    onChange={(e) => updateVariantField(size, "price", e.target.value)}
                    className="border p-1 rounded w-20 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={variant?.stock || ""}
                    onChange={(e) => updateVariantField(size, "stock", e.target.value)}
                    className="border p-1 rounded w-20 text-sm"
                  />
                </div>
                
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={uploading}
        >
          {initialData ? "Update Product" : "Create Product"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
