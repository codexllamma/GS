
import { useCartStore } from "@/store/useCartStore";
import Header from "./header";
import Hero from "./hero";

const UserDashboard = () => {
  const { cart } = useCartStore();
  
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  


  return(
     <>
     <Header/>
     <Hero/>
     </>
  ) 
}

export default UserDashboard;