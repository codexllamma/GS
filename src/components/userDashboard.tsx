import ProductsPage from "@/pages/product/products";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

const UserDashboard = () => {
  const { cart } = useCartStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return(
     <>
     <h1> This be the user dashboard man</h1> 

      
    <nav className="flex justify-between p-4 bg-gray-800 text-white">
      <Link 
      href="/cart" passHref
      className="relative px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
      >
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 rounded-full text-xs px-1">
              {cartCount}
            </span>
          )}
        
      </Link>
      <Link href="/orders/orders-page" passHref
      className="relative mx-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
      >
          Your Orders 
      </Link>
    </nav>
     <ProductsPage />
     </>
  ) 
}

export default UserDashboard;