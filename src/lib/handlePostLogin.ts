// lib/handlePostLogin.ts
import { NextRouter } from "next/router";

export async function handlePostLogin(router: NextRouter) {
  const redirectIntent = localStorage.getItem("redirectIntent");


  const guestCartRaw = localStorage.getItem("guest_cart");

  if (guestCartRaw) {
    const guestItems = JSON.parse(guestCartRaw);

    if (Array.isArray(guestItems) && guestItems.length > 0) {
      await fetch("/api/cart/merge-after-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guestItems }),
      });
    }

    localStorage.removeItem("guest_cart");
  }

  if (redirectIntent) {
    localStorage.removeItem("redirectIntent");
    router.replace(redirectIntent);
    return;
  }

  
  router.replace("/dashboard");
}
