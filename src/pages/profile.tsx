// pages/profile.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Phone, Calendar, Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/header";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Profile fetch error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        No profile found.
      </div>
    );
  }

  return (
    <>
    <Header/>
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl shadow-xl p-10"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full border border-black/20 bg-black/5 flex items-center justify-center overflow-hidden">
            {user.image ? (
              <Image
                src={user.image}
                width={130}
                height={130}
                alt="Profile"
                className="object-cover"
              />
            ) : (
              <User size={56} className="text-black/40" />
            )}
          </div>

          <h1 className="mt-4 text-3xl font-semibold text-black">
            {user.name || "Unnamed User"}
          </h1>

          <p className="text-xs mt-1 px-3 py-1 rounded-full bg-black text-white uppercase tracking-wide">
            {user.authProvider || "Email Login"}
          </p>
        </div>

        {/* Basic Info */}
        <h2 className="text-xl font-semibold text-black mt-12 mb-4">Account Information</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-black rounded-xl p-4 flex items-center gap-4">
            <Mail size={22} className="text-black" />
            <div>
              <p className="text-xs uppercase text-gray-500">Email</p>
              <p className="text-lg font-medium">{user.email || "Not Provided"}</p>
            </div>
          </div>

          <div className="bg-white border border-black rounded-xl p-4 flex items-center gap-4">
            <Phone size={22} className="text-black" />
            <div>
              <p className="text-xs uppercase text-gray-500">Phone</p>
              <p className="text-lg font-medium">{user.phoneNumber || "Not Provided"}</p>
            </div>
          </div>

          <div className="bg-white border border-black rounded-xl p-4 flex items-center gap-4">
            <Calendar size={22} className="text-black" />
            <div>
              <p className="text-xs uppercase text-gray-500">Member Since</p>
              <p className="text-lg font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Address List */}
        <h2 className="text-xl font-semibold text-black mt-12 mb-4">Saved Addresses</h2>

        <div className="space-y-4">
          {user.addresses?.length ? (
            user.addresses.map((addr: any) => (
              <div
                key={addr.id}
                className="bg-white border border-black rounded-xl p-5 flex items-start gap-4"
              >
                <Home size={22} className="text-black mt-1" />
                <div>
                  <p className="font-medium text-lg">{addr.line1}</p>
                  <p className="text-gray-700">
                    {addr.city}, {addr.state}
                  </p>
                  <p className="text-gray-700">
                    {addr.country} - {addr.postal}
                  </p>

                  {addr.isDefault && (
                    <span className="mt-2 inline-block text-xs bg-black text-white px-2 py-0.5 rounded">
                      Default Address
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No addresses added.</p>
          )}
        </div>

        {/* Orders */}
        <div className="text-center mt-12">
          <Link
            href="/orders/orders-page"
            className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full hover:bg-gray-900 transition text-sm"
          >
            View Your Orders
            <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
    </>
  );
}
