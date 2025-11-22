"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Chrome } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed");
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (loginRes?.error === "PRELAUNCH_ACCESS_DENIED") {
        toast.error("Only approved users allowed during pre-launch.");
        setLoading(false);
        return;
      }

      if (loginRes?.error) {
        throw new Error(loginRes.error);
      }

      // Merge guest cart
      try {
        await fetch("/api/cart/import-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch {}

      const redirectIntent = localStorage.getItem("redirectIntent");
      localStorage.removeItem("redirectIntent");

      if (onSuccess) {
        onSuccess();
        router.push(redirectIntent || "/dashboard");
      } else {
        router.push(redirectIntent || "/dashboard");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    const redirectIntent =
      localStorage.getItem("redirectIntent") || "/dashboard";

    await signIn("google", {
      callbackUrl: redirectIntent,
    });
  };

  return (
    <div className="w-full">
      {/* HEAD */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {isSignUp ? "Join and start exploring" : "Sign in to continue"}
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence>
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <User className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-md bg-white/90 focus:ring-1 focus:ring-black outline-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* EMAIL */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 border rounded-md bg-white/90 focus:ring-1 focus:ring-black outline-none"
          />
        </div>

        {/* PASSWORD */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-12 py-3 border rounded-md bg-white/90 focus:ring-1 focus:ring-black outline-none"
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-neutral-500"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-md bg-black text-white font-medium hover:opacity-90 transition"
        >
          {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      {/* GOOGLE AUTH */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full mt-4 py-3 border rounded-md flex items-center justify-center gap-2 hover:bg-neutral-50 transition"
      >
        <Chrome size={18} /> Continue with Google
      </button>

      {/* TOGGLE LOGIN <-> SIGNUP */}
      <p className="text-center text-sm text-neutral-600 mt-4">
        {isSignUp ? "Already have an account? " : "New here? "}
        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="underline text-black"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      {/* ERROR */}
      {error && (
        <p className="text-red-600 text-center mt-3 text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthForm;
