"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClose = () => {
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const redirectIntent =
        typeof window !== "undefined"
          ? localStorage.getItem("redirectIntent") || "/"
          : "/";

      if (typeof window !== "undefined") {
        localStorage.removeItem("redirectIntent");
      }

      await signIn("google", { callbackUrl: redirectIntent });
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: isMobile
      ? { y: "100%", opacity: 1 }
      : { opacity: 0, scale: 0.96, y: 8 },
    visible: { y: 0, opacity: 1, scale: 1 },
    exit: isMobile
      ? { y: "100%", opacity: 1 }
      : { opacity: 0, scale: 0.96, y: 8 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "linear" }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={
              isMobile
                ? { type: "spring", damping: 28, stiffness: 300 }
                : { duration: 0.22, ease: "easeOut" }
            }
            className="relative z-10 w-full max-w-sm sm:max-w-md bg-brand-bg rounded-t-2xl sm:rounded-sm shadow-2xl border border-brand-border p-6 sm:p-8 flex flex-col"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-brand-border rounded-full mx-auto mb-4 sm:hidden flex-shrink-0" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-brand-textSec hover:text-brand-charcoal hover:bg-brand-card rounded-full transition cursor-pointer z-20"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Brand Header */}
            <div className="text-center mt-1 mb-6">
              <span className="text-[10px] font-bold tracking-[0.25em] text-brand-charcoal uppercase block mb-1">
                HIÈR ACCOUNT
              </span>
              <h2 className="font-serif text-2xl font-normal text-brand-charcoal tracking-wide">
                Welcome to HIÈR
              </h2>
              <p className="text-xs text-brand-textSec mt-2 max-w-xs mx-auto leading-relaxed">
                Sign in with Google to view your order history, save addresses, and access seamless checkout.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50/90 border border-red-200 rounded-sm flex items-center gap-2 text-xs text-red-700">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Login Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-11 sm:h-12 bg-white border border-brand-border hover:border-brand-charcoal rounded-sm flex items-center justify-center gap-3 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-brand-charcoal transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin text-brand-charcoal" />
                ) : (
                  <>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-brand-textSec/80 text-center leading-normal pt-2">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};