import AdminDashboard from "@/components/adminDashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <p className="p-8 text-center">Loading...</p>;
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return <AdminDashboard />;
}