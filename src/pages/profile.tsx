"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { signOut, useSession, signIn } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setLoadingProfile(true);
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => setUser(data.user || data))
        .catch((err) => console.error("Profile fetch error", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [status]);

  // 1. LOADING STATE
  if (status === "loading" || loadingProfile) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={26} className="animate-spin text-brand-charcoal stroke-[1.5]" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-brand-textSec font-medium">
            Loading Account...
          </span>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED STATE
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-brand-olive selection:text-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm bg-white border border-brand-border rounded-sm shadow-xs p-7 sm:p-9 text-center"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] text-brand-charcoal uppercase block mb-1">
            HIÈR CLIENT
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-brand-charcoal tracking-wide">
            Sign In
          </h1>
          <p className="text-xs text-brand-textSec mt-2 leading-relaxed mb-6">
            Access your order history, profile details, and saved delivery addresses.
          </p>

          <button
            type="button"
            onClick={() => {
              setGoogleLoading(true);
              signIn("google", { callbackUrl: "/profile" });
            }}
            disabled={googleLoading}
            className="w-full h-11 bg-white border border-brand-border hover:border-brand-charcoal rounded-sm flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-brand-charcoal transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
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

          <div className="mt-6 pt-5 border-t border-brand-border/60">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-textSec hover:text-brand-charcoal transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back to Shopping</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. AUTHENTICATED BUT NO DATA FALLBACK
  if (!user && !session?.user) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 font-sans">
        <div className="text-center">
          <p className="font-serif text-lg text-brand-charcoal mb-4">Profile details unavailable</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-brand-charcoal underline underline-offset-4 cursor-pointer"
            >
              Back to Shopping
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs uppercase tracking-widest text-red-700 underline underline-offset-4 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = user || session?.user || {};

  // 4. MAIN PROFILE UI
  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal font-sans flex flex-col selection:bg-brand-olive selection:text-white py-8 sm:py-12 px-4 sm:px-8">
      <main className="max-w-4xl w-full mx-auto">
        {/* Top Navigation / Back to Shopping Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-textSec hover:text-brand-charcoal transition-colors cursor-pointer group"
          >
            <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Shopping</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-brand-border rounded-sm shadow-xs p-6 sm:p-10"
        >
          {/* Header Profile Section */}
          <div className="flex flex-col items-center text-center pb-8 border-b border-brand-border">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-brand-border bg-brand-stone/30 flex items-center justify-center overflow-hidden shadow-xs">
              {currentUser.image ? (
                <Image
                  src={currentUser.image}
                  width={112}
                  height={112}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <User size={42} className="text-brand-textSec stroke-[1.5]" />
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-brand-charcoal tracking-wide mt-4">
              {currentUser.name || "Valued Client"}
            </h1>

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 bg-brand-card border border-brand-border text-brand-textSec mt-2.5 rounded-sm">
              {currentUser.authProvider || "Google Account"}
            </span>
          </div>

          {/* Account Information */}
          <div className="mt-8">
            <h2 className="text-xs font-bold tracking-[0.2em] text-brand-charcoal uppercase mb-4">
              Account Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="bg-brand-card/60 border border-brand-border rounded-sm p-4 flex items-center gap-3.5">
                <Mail size={18} className="text-brand-textSec stroke-[1.6] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold">
                    Email Address
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-brand-charcoal truncate mt-0.5">
                    {currentUser.email || "Not Provided"}
                  </p>
                </div>
              </div>

              <div className="bg-brand-card/60 border border-brand-border rounded-sm p-4 flex items-center gap-3.5">
                <Phone size={18} className="text-brand-textSec stroke-[1.6] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold">
                    Phone Number
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-brand-charcoal truncate mt-0.5">
                    {currentUser.phoneNumber || "Not Linked"}
                  </p>
                </div>
              </div>

              <div className="bg-brand-card/60 border border-brand-border rounded-sm p-4 flex items-center gap-3.5 sm:col-span-2">
                <Calendar size={18} className="text-brand-textSec stroke-[1.6] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-brand-textSec font-semibold">
                    Client Since
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-brand-charcoal truncate mt-0.5">
                    {currentUser.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString("en-IN", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Active Member"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="mt-10">
            <h2 className="text-xs font-bold tracking-[0.2em] text-brand-charcoal uppercase mb-4">
              Saved Addresses
            </h2>

            <div className="space-y-3">
              {currentUser.addresses?.length ? (
                currentUser.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="bg-brand-card/40 border border-brand-border rounded-sm p-4 sm:p-5 flex items-start gap-4"
                  >
                    <Home size={18} className="text-brand-textSec stroke-[1.6] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-brand-charcoal leading-snug">
                        {addr.line1}
                      </p>
                      <p className="text-[11px] sm:text-xs text-brand-textSec mt-1 leading-normal">
                        {addr.city}, {addr.state} {addr.postal}
                      </p>
                      <p className="text-[11px] sm:text-xs text-brand-textSec leading-normal">
                        {addr.country}
                      </p>

                      {addr.isDefault && (
                        <span className="mt-2.5 inline-block text-[9px] uppercase font-bold tracking-widest bg-brand-charcoal text-brand-bg px-2.5 py-0.5 rounded-xs">
                          Default Delivery
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-brand-card/30 border border-dashed border-brand-border rounded-sm text-center">
                  <p className="text-xs text-brand-textSec">No saved addresses on file yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 pt-8 border-t border-brand-border">
            <Link
              href="/orders/orders-page"
              className="h-11 bg-brand-btn text-white text-[11px] font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition active:scale-[0.99] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Orders</span>
              <ArrowRight size={14} />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="h-11 bg-red-50/80 border border-red-200 text-red-700 hover:bg-red-100 text-[11px] font-semibold uppercase tracking-widest rounded-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}