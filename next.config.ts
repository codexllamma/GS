import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'rzgwffrwwmxtnontocdv.supabase.co',   // your existing one
      'lh3.googleusercontent.com',          // Google user images
      'avatars.githubusercontent.com',      // GitHub images (optional)
    ],
  },
};

export default nextConfig;
