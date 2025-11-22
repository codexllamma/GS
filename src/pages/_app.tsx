import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import Footer from "@/components/footer";
import { useRouter } from "next/router";
import AuthModal from "@/components/authModal";

function AuthGate() {
  const { status } = useSession();
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCart(true);   // DB mode
    } else if (status === "unauthenticated") {
      fetchCart(false);  // Guest mode
    }
  }, [status, fetchCart]);

  return null;
}


export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();

  // Routes where footer should not appear
  const hideFooterRoutes = [
    "/auth",
    "/cart",
    "/checkout",
    "/order-confirmation",
  ];
  const shouldHideFooter = hideFooterRoutes.some((path) =>
    router.pathname.startsWith(path)
  );

  return (
    <SessionProvider session={session}>
      {/* Side-effects and session-bound cart hydration */}
      <AuthGate />

      {/* Actual page */}
      <Component {...pageProps} />

      {/* Global Auth Modal MUST BE HERE */}
      <AuthModal />

      {/* Footer conditional */}
      <div className="">

      {!shouldHideFooter && <Footer />}
      </div>
    </SessionProvider>
  );
}
