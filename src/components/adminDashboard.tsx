import AdminProductsPage from "@/pages/admin/adminProducts";
import Link from "next/link";
const AdminDashboard = () => {
  
  return (
    
    <>
    <Link href="/orders/orders-page" passHref
      className="relative mx-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
      >
          View all orders
      </Link>
    <AdminProductsPage/>
    </>

  )
}

export default AdminDashboard;