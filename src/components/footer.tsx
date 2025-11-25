// components/Footer.tsx
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Shield,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-300 py-12 px-6 md:px-16 overflow-hidden">
      {/* Animated Background Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Grid Layout */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Info */}
        <div>
          <h2 className="font-saira text-2xl font-bold bg-gradient-to-r text-white bg-clip-text text-transparent mb-3">
            ĦIÈR
          </h2>
          <p className="text-gray-400 mb-4 leading-relaxed">
            
            To wear   <span className="font-saira">
                   ĦIÈR
              </span> is to wear heritage-
            a signature of discretion, 
            a silent emblem of belonging to the few who truly know.
          </p>
          <div className="flex space-x-4">
            {[Instagram, Linkedin, Twitter, Youtube].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-amber-400 transition-colors duration-300"
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {[
              { name: "About", path: "/legal/about" },
              { name: "Privacy Policy", path: "/legal/privacy-policy" },
              { name: "Terms of Use", path: "/legal/terms" },
              { name: "Returns & Refunds", path: "/legal/returns" },
              { name: "Cookie Policy", path: "/legal/cookies" },
              { name: "Legal Notice", path: "/legal/legal-notice" },
              { name: "Shipping", path: "/legal/shipping"}
            ].map((link, idx) => (
              <li key={idx}>
                <Link
                  href={link.path}
                  className="font-apercu hover:text-amber-400 transition-colors duration-300"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>support@hièr.store</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>+91 9920511572 </span>
            </li>
          </ul>
        </div>

        {/* Security */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-gray-400 leading-relaxed">
              Payments secured via <strong>Razorpay</strong>.  
              Your data is encrypted and protected.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} THKR Futuretech Pvt. Ltd. All Rights Reserved.  
        hièr and its logo are registered trademarks.
      </div>
    </footer>
  );
}
