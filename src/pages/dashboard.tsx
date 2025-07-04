import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/adminDashboard";
import UserDashboard from "@/components/userDashboard";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Dashboard = () => {
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
            {session?.user?.isAdmin ? <AdminDashboard /> : <UserDashboard />}
        </>
    );
};

export default Dashboard;
