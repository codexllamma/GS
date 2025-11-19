import { useAuthStatus } from "./useAuthStatus";
import { useRouter } from "next/router";
import { useAuthModal } from "@/store/useAuthModal";

export function useAuthGate() {
  const router = useRouter();
  const { isAuth, checking } = useAuthStatus();
  const { open } = useAuthModal();

  async function guardCheckout() {
    if (checking) return;

    if (isAuth) {
      router.push("/checkout");
    } else {
      localStorage.setItem("redirectIntent", "/checkout");
      open();
    }
  }

  return { guardCheckout };
}
