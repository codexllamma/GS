import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";

function AuthGate() {
  const { data: session, status } = useSession();
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCart();
    }
  }, [status, fetchCart]);

  return null; // No UI rendered, only logic
}


export default function App({ Component, pageProps:{session, ...pageProps} }: AppProps) {

  return (
    <SessionProvider session={session}>
      <AuthGate/>
      <Component {...pageProps} />
    </SessionProvider>
    
  );
}
