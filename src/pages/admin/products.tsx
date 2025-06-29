import { useEffect, useState } from "react";
import ProductForm from "@/components/productForm";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

type ProductInput = {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
};

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        console.error("Failed to fetch products.");
      }
    };
    fetchProducts();
  }, []);

  const handleCreate = async (productData: ProductInput) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    if (res.ok) {
      const newProduct = await res.json();
      setProducts(prev => [...prev, newProduct]);
      setShowForm(false);
    } else {
      console.error("Failed to create product.");
    }
  };

  const handleUpdate = async (productData: ProductInput) => {
    if (!editingProduct) return;

    const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    if (res.ok) {
      const updatedProduct = await res.json();
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditingProduct(null);
      setShowForm(false);
    } else {
      console.error("Failed to update product.");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      console.error("Failed to delete product.");
    }
  };

  if (status === "loading") return <div className="p-4">Loading...</div>;
  if (!session?.user?.isAdmin) return <div className="p-4">Access Denied</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin: Manage Products</h1>
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
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
        >
          Create New Product
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-semibold text-lg">{product.name}</h2>
            <p className="text-sm text-gray-600 mb-1">{product.description}</p>
            <p className="text-sm">Price: ₹{product.price}</p>
            <p className="text-sm">Category: {product.category}</p>
            <p className="text-sm">Stock: {product.stock}</p>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-32 object-cover mt-2 rounded"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
