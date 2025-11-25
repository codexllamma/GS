import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect,useRef } from "react";
import { useCartStore } from "@/store/useCartStore";
import Footer from "@/components/footer";
import { useRouter } from "next/router";
import AuthModal from "@/components/authModal";

function AuthGate() {
  const { data: session, status } = useSession();
  const fetchCart = useCartStore((state) => state.fetchCart);
  const syncGuestToDB = useCartStore((state) => state.syncGuestToDB);

  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === lastStatusRef.current) return;
    lastStatusRef.current = status;

    if (status === "unauthenticated") {
      fetchCart(false);
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      // 🛠 Ensure cookie transport finished
      const timer = setTimeout(async () => {
        await syncGuestToDB();
        await fetchCart(true);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [status, session, fetchCart, syncGuestToDB]);

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
      <div className="mt-10">

      {!shouldHideFooter && <Footer />}
      </div>
    </SessionProvider>
  );
}
