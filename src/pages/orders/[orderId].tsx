import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found or you do not have permission to view it.</div>;

  return (
    <>
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Order Details</h1>
      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Total:</strong> ₹{order.total}</p>
      <p><strong>Placed on:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>

      <h2 className="mt-4 font-semibold">Items:</h2>
      <ul className="list-disc list-inside">
        {order.orderItems.map((item: any) => (
          <li key={item.id}>
            {item.product.name} x {item.quantity}
          </li>
        ))}
      </ul>
    </div>
    
    </>
  );
}


