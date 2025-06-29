import { signIn, useSession } from "next-auth/react";
import AdminDashboard from "@/components/adminDashboard";
import UserDashboard from "@/components/userDashboard";
import Router, { useRouter } from "next/router";

const Dashboard = () => {
  const router = useRouter();
  const {data: session, status} = useSession();
  
  if(status === "loading") return <p>Loading...</p>;
  
  if(!session?.user?.isAdmin){
    router.push('/ ') ;
    return null;
  }
  
  return (
    <>
      {session?.user.isAdmin ? <AdminDashboard/> : <UserDashboard/>}
    </>
  );
}

export default Dashboard;

