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
import { Toaster } from "react-hot-toast";

function ClientHydrationWrapper({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null; // stable first render

  return <>{children}</>;
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
        

        {/* Actual page */}
        <Component {...pageProps} />
        <Toaster position="top-center" />
        {/* Global Auth Modal */}
        
        

        {/* Footer */}
        <div className="mt-10">
          {!shouldHideFooter && <Footer />}
        </div>
      </ClientHydrationWrapper>
    </SessionProvider>
  );
}
