import AdminProductsPage from "@/pages/admin/adminProducts";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, ExternalLink } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-neutral-50 font-apercu">
      {/* Sidebar / Navigation Placeholder (Simple Top Bar for now) */}
      <div className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={20} />
          <span className="font-bold tracking-wide">ADMIN CONSOLE</span>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/orders/orders-page" className="flex items-center gap-2 hover:text-gray-300 transition">
            <ShoppingBag size={16} /> Manage Orders
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:text-gray-300 transition">
             Live Site <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <main>
        <AdminProductsPage />
      </main>
    </div>
  );
};

export default AdminDashboard;