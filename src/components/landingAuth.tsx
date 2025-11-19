"use client";
import { useAuthModal } from "@/store/useAuthModal";

const LandingAuthButton = () => {
  const { open } = useAuthModal();

  const handleClick = () => {
    localStorage.setItem("redirectIntent", "/dashboard");
    open();
  };

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3 rounded-full bg-black text-white hover:opacity-90"
    >
      Login / Sign Up
    </button>
  );
};

export default LandingAuthButton;
