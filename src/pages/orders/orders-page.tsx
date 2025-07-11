import { useSession} from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import UserOrders from "@/components/userOrders";
import AdminOrders from "@/components/adminOrders";
const OrdersPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        }
    }, [status, router]);

    if (status === "loading") return <p>Loading...</p>;

    return (
        <>
            {session?.user?.isAdmin ? <AdminOrders/> : <UserOrders/>}
        </>
    );
}

export default OrdersPage;
