// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import Footer from "@/components/footer";
import { useRouter } from "next/router";
import AuthModal from "@/components/authModal";

function ClientHydrationWrapper({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null; // stable first render

  return <>{children}</>;
}

function AuthGate() {
  const { data: session, status } = useSession();
  const fetchCart = useCartStore((state) => state.fetchCart);
  const syncGuestToDB = useCartStore((state) => state.syncGuestToDB);

  const router = useRouter();
  const lastStatusRef = useRef<string | null>(null);

  // redirect intent handler
  useEffect(() => {
    if (status === "authenticated") {
      const intent = localStorage.getItem("redirectIntent");
      if (intent) {
        router.replace(intent);
        localStorage.removeItem("redirectIntent");
      }
    }
  }, [status]);

  // cart handling
  useEffect(() => {
    if (status === lastStatusRef.current) return;
    lastStatusRef.current = status;

    if (status === "unauthenticated") {
      fetchCart(false);
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
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
      <ClientHydrationWrapper>
        {/* Side-effects and session/cart sync */}
        <AuthGate />

        {/* Actual page */}
        <Component {...pageProps} />

        {/* Global Auth Modal */}
        <AuthModal />

        {/* Footer */}
        <div className="mt-10">
          {!shouldHideFooter && <Footer />}
        </div>
      </ClientHydrationWrapper>
    </SessionProvider>
  );
}
