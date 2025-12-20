"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Phone, Calendar, Home, ArrowRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/header";
import { signOut, useSession } from "next-auth/react"; // <--- Import useSession
import AuthForm from "@/components/authForm"; // <--- Import your Auth Component

export default function ProfilePage() {
  const { data: session, status } = useSession(); // <--- Check Auth Status
  const [user, setUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Fetch detailed profile data only when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      setLoadingProfile(true);
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch((err) => console.error("Profile fetch error", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [status]);

  // 1. LOADING STATE (Session or Data)
  if (status === "loading" || loadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED STATE -> SHOW LOGIN FORM (The Fix)
  if (status === "unauthenticated") {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
             <div className="text-center">
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                   Sign in to your account
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                   To view your profile, orders, and saved addresses.
                </p>
             </div>
             {/* Renders the Auth Form we just fixed */}
             <AuthForm /> 
          </div>
        </div>
      </>
    );
  }

  // 3. AUTHENTICATED BUT NO DATA (Fallback)
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600 gap-4 flex-col">
        <p>Profile unavailable.</p>
        <button onClick={() => signOut()} className="text-red-500 underline">Sign out</button>
      </div>
    );
  }

  // 4. MAIN PROFILE UI
  return (
    <>
    <Header/>
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 px-6 py-10 font-apercu">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl shadow-xl p-6 md:p-10"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full border border-black/20 bg-black/5 flex items-center justify-center overflow-hidden shadow-sm">
            {user.image ? (
              <Image
                src={user.image}
                width={130}
                height={130}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <User size={56} className="text-black/40" />
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold text-black tracking-tight">
            {user.name || "Unnamed User"}
          </h1>

          <p className="text-xs mt-2 px-3 py-1 rounded-full bg-black text-white uppercase tracking-wide font-medium">
            {user.authProvider || "Email Login"}
          </p>
        </div>

        {/* Basic Info */}
        <h2 className="text-xl font-bold text-black mt-12 mb-4">Account Information</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <Mail size={22} className="text-gray-600" />
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Email</p>
              <p className="text-base font-medium">{user.email || "Not Provided"}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <Phone size={22} className="text-gray-600" />
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Phone</p>
              <p className="text-base font-medium">{user.phoneNumber || "Not Provided"}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <Calendar size={22} className="text-gray-600" />
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Member Since</p>
              <p className="text-base font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Address List */}
        <h2 className="text-xl font-bold text-black mt-12 mb-4">Saved Addresses</h2>

        <div className="space-y-4">
          {user.addresses?.length ? (
            user.addresses.map((addr: any) => (
              <div
                key={addr.id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 shadow-sm"
              >
                <Home size={22} className="text-gray-600 mt-1" />
                <div>
                  <p className="font-semibold text-lg">{addr.line1}</p>
                  <p className="text-gray-600">
                    {addr.city}, {addr.state}
                  </p>
                  <p className="text-gray-600">
                    {addr.country} - {addr.postal}
                  </p>

                  {addr.isDefault && (
                    <span className="mt-2 inline-block text-[10px] uppercase font-bold bg-black text-white px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No addresses added yet.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-16 pt-8 border-t border-gray-100">
          <Link
            href="/orders/orders-page"
            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition font-medium shadow-lg hover:shadow-xl w-full md:w-auto justify-center"
          >
            View Your Orders
            <ArrowRight size={16} />
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-8 py-3 bg-white text-red-600 border border-red-100 rounded-full hover:bg-red-50 transition font-medium w-full md:w-auto justify-center"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </motion.div>
    </div>
    </>
  );
}