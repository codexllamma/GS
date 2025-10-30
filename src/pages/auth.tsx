import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

      
      const res = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (res?.error) throw new Error(res.error);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen rounded-[2.5rem] bg-gradient-to-br from-amber-100/50 via-white/40 to-orange-200/50 flex items-center justify-center p-4 relative overflow-hidden backdrop-blur-[8px] border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-50 to-amber-60 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.1, scale: 0.8 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-amber-50 to-orange-60 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          layout
          className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/20 p-8 relative overflow-hidden"
        >
          {/* GS Logo */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl mb-4 shadow-lg mx-auto"
            >
              <span className="text-white font-bold text-xl tracking-wider">GS</span>
            </motion.div>
          </div>

          {/* Header Text */}
          <div className="text-center mb-8">
            <AnimatePresence mode="wait">
              <motion.h1
                key={isSignUp ? "signup" : "signin"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
              >
                {isSignUp ? "Create Account" : "Welcome Back"}
              </motion.h1>
            </AnimatePresence>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 mt-2"
            >
              {isSignUp ? "Join our community today" : "Sign in to your account"}
            </motion.p>
          </div>

          {/* Form */}
          <motion.form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 text-gray-800 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 placeholder-gray-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 text-gray-800 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 placeholder-gray-500"
              />
            </motion.div>

            <motion.div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-12 py-4 text-gray-800 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
            >
              <motion.div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center">
                {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </motion.form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl"
              >
                <p className="text-red-600 text-sm text-center font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign In */}
          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
            >
              <Chrome className="h-5 w-5" /> Sign in with Google
            </button>
          </div>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </p>
            <motion.button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 font-semibold hover:text-black transition-colors duration-300 relative"
            >
              <motion.span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-400 origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
              Switch to {isSignUp ? "Sign In" : "Sign Up"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
