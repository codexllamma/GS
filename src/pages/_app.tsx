import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import Footer from "@/components/footer";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const hideFooterRoutes = ["/auth", "/product", "/cart", "/checkout", "/order-confirmation"]; 
  const shouldHideFooter = hideFooterRoutes.some((path) =>
  router.pathname.startsWith(path) || router.asPath.startsWith(path));

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
       { !shouldHideFooter && <Footer/> }
    </SessionProvider>
    
  );
}
