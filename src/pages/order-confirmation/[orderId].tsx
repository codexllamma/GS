import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { Order,OrderItem,Product } from "@/generated/prisma";

// Define your type for fetched order
type OrderWithItems = Order & {
  orderItems: (OrderItem & {
    product: Product;
  })[];
};

const OrderConfirmationPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
      
    const handleReroute = async() => {
      router.push('/dashboard')
    }

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
  if (!order) return <div>Order not found.</div>;

  return (
    <>
    <div>
      <h1>Order Confirmation</h1>
      <p>Order ID: {order.id}</p>
      <p>Status: {order.status}</p>
      <p>Total: ₹{order.total}</p>

      <h2>Items:</h2>
      <ul>
        {order.orderItems.map((item) => (
          <li key={item.id}>
            {item.product.name} x {item.quantity}
          </li>
        ))}
      </ul>
    </div>
    <button onClick={() => router.push('/dashboard')}>
       Back to Shopping
    </button>
    
    </>
  );
};

export default OrderConfirmationPage;
