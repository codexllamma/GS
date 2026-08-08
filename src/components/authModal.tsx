"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen) return null;

  const resetState = () => {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setError(null);
    setInfoMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // --- GOOGLE SIGN-IN HANDLER ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const redirectIntent =
        typeof window !== "undefined"
          ? localStorage.getItem("redirectIntent") || "/dashboard"
          : "/dashboard";

      // Clear stored redirect intent after reading
      if (typeof window !== "undefined") {
        localStorage.removeItem("redirectIntent");
      }

      await signIn("google", { callbackUrl: redirectIntent });
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  // --- PHONE OTP SEND HANDLER ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    if (!cleanNumber || cleanNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/auth/msg91/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanNumber }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep("otp");
        if (data.message?.includes("123456")) {
          setInfoMessage("Mock OTP sent! Use code: 123456");
        }
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- PHONE OTP VERIFY HANDLER ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/msg91/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp, isSignUp }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.userExists && isSignUp) {
          setInfoMessage(data.message || "Account exists. Logging you in...");
        }

        const signInRes = await signIn("phone-otp", {
          phoneNumber: data.user.phoneNumber || phoneNumber,
          userId: data.user.id,
          redirect: false,
        });

        if (signInRes?.ok) {
          // Merge cart if guest snapshot exists
          try {
            await fetch("/api/cart/merge-after-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
          } catch {}

          const redirectIntent =
            typeof window !== "undefined"
              ? localStorage.getItem("redirectIntent") || "/dashboard"
              : "/dashboard";

          if (typeof window !== "undefined") {
            localStorage.removeItem("redirectIntent");
          }

          handleClose();
          router.push(redirectIntent);
        } else {
          setError("Failed to create user session. Please try again.");
        }
      } else {
        setError(data.message || "Invalid OTP code");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: isMobile ? { y: "100%", opacity: 1 } : { opacity: 0, scale: 0.95, y: 10 },
    visible: { y: 0, opacity: 1, scale: 1 },
    exit: isMobile ? { y: "100%", opacity: 1 } : { opacity: 0, scale: 0.95, y: 10 },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container: Bottom sheet on mobile, centered card on desktop */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={
            isMobile
              ? { type: "spring", damping: 28, stiffness: 300 }
              : { duration: 0.2 }
          }
          className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] flex flex-col"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4 sm:hidden flex-shrink-0" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition cursor-pointer z-20"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto pr-1 flex-1">
            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-neutral-100 mb-5 pb-2 pr-8">
              <button
                onClick={() => {
                  setIsSignUp(false);
                  resetState();
                }}
                className={`text-sm sm:text-base font-bold mr-6 transition cursor-pointer ${
                  !isSignUp
                    ? "text-black border-b-2 border-black pb-2 -mb-2.5"
                    : "text-neutral-400 hover:text-black"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsSignUp(true);
                  resetState();
                }}
                className={`text-sm sm:text-base font-bold transition cursor-pointer ${
                  isSignUp
                    ? "text-black border-b-2 border-black pb-2 -mb-2.5"
                    : "text-neutral-400 hover:text-black"
                }`}
              >
                Register
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                {isSignUp ? "Create Your Account" : "Welcome Back"}
              </h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                {isSignUp
                  ? "Sign up with your phone or Google account to track orders."
                  : "Log in to access your order history and account settings."}
              </p>
            </div>

            {/* Error & Info Alerts */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-600">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-700">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Step 1: Phone Input */}
            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-semibold text-neutral-500 border-r border-neutral-200 pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 10-digit number"
                      className="w-full h-12 pl-16 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Input */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                      Enter Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      className="text-[11px] text-neutral-500 underline hover:text-black cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full h-12 px-4 text-center tracking-[0.25em] text-lg font-bold bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-100" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 border border-neutral-200 rounded-xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:border-black transition cursor-pointer active:scale-[0.99] mb-2 sm:mb-0 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};