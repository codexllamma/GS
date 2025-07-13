import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Product } from "@/generated/prisma";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const res = await fetch(`/api/product/${id}`);
      const data = await res.json();
      setProduct(data);
    };
    fetchProduct();
  }, [id]);

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      {product.image && (
        <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded mb-4" />
      )}
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <p className="text-lg font-semibold mb-2">₹{product.price}</p>
      <p className="text-sm text-gray-500">Category: {product.category}</p>
      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
    </div>
  );
}
