import { useState } from "react";
import { supabase } from "@/lib/supabase";
interface ProductFormProps {
  initialData?: {
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
  };
  onSubmit: (data: {
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
  }) => void;
  onCancel?: () => void;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    image: initialData?.image || "",
    category: initialData?.category || "",
    stock: initialData?.stock || 0,
  });
  const [uploading, setUploading] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        alert("Upload failed.");
        return;
      }

      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      setForm(prev => ({
        ...prev,
        image: data.publicUrl,
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error. Check console.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg max-w-md mx-auto">
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
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
      <input
        type="number"
        name="price"
        value={form.price}
        onChange={handleChange}
        placeholder="Price"
        className="border p-2 w-full rounded"
        required
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Upload Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="border p-2 rounded"
        />
        {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      </div>

      {form.image && (
        <img
          src={form.image}
          alt="Uploaded preview"
          className="w-full h-48 object-cover rounded border"
        />
      )}

      <input
        type="text"
        name="category"
        value={form.category}
        onChange={handleChange}
        placeholder="Category"
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="number"
        name="stock"
        value={form.stock}
        onChange={handleChange}
        placeholder="Stock"
        className="border p-2 w-full rounded"
        required
      />

      <div className="flex gap-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
