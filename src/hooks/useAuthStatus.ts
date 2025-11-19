import { useSession } from "next-auth/react";

export function useAuthStatus() {
  const { data: session, status } = useSession();

  return {
    isAuth: !!session,
    checking: status === "loading", 
    session,
  };
}
