"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Instagram,
  Facebook,
  ShieldCheck,
  Mail,
  Phone,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const QUICK_LINKS = [
  { name: "About HIÈR", path: "/legal/about" },
  { name: "Shipping Information", path: "/legal/shipping" },
  { name: "Returns & Exchanges", path: "/legal/returns" },
  { name: "Privacy Policy", path: "/legal/privacy-policy" },
  { name: "Terms of Service", path: "/legal/terms" },
  { name: "Cookie Policy", path: "/legal/cookies" },
  { name: "Legal Notice", path: "/legal/legal-notice" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-brand-charcoal text-brand-bg pt-12 sm:pt-14 pb-6 sm:pb-8 px-5 sm:px-10 md:px-16 border-t border-brand-charcoal">
      <div className="max-w-7xl mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-10 border-b border-white/10">
          
          {/* 1. Brand Philosophy */}
          <div className="flex flex-col items-start space-y-4">
            
            <p className="text-xs text-white/70 font-light leading-relaxed max-w-xs">
              Built on the enduring belief that true style never needs to announce itself. Thoughtful design, honest craftsmanship, everyday confidence.
            </p>
            
            {/* Social Channels */}
            <div className="flex items-center gap-2.5 pt-2">
              <motion.a
                href="https://www.instagram.com/hier_society"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={14} className="stroke-[1.6]" />
              </motion.a>

              <motion.a
                href="https://www.facebook.com/share/1EHTdmoUvz/"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={14} className="stroke-[1.6]" />
              </motion.a>
            </div>
          </div>

          {/* 2. Subtly Interactive Quick Links */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 mb-4">
              Client Service
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="group inline-flex items-center gap-1.5 text-xs text-white/65 hover:text-white transition-colors duration-200"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-white/70 transition-all duration-300 group-hover:w-full" />
                    </span>
                    <ArrowUpRight
                      size={12}
                      className="opacity-0 -translate-x-1 translate-y-0.5 text-white/60 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Concierge / Contact */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 mb-4">
              Concierge
            </h3>
            <ul className="space-y-3.5 text-xs text-white/75 font-light">
              <li>
                <a
                  href="mailto:support@hièr.store"
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors group"
                >
                  <Mail size={15} className="text-white/50 group-hover:text-white transition-colors stroke-[1.6]" />
                  <span>support@hièr.store</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+919920511572"
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors group"
                >
                  <Phone size={15} className="text-white/50 group-hover:text-white transition-colors stroke-[1.6]" />
                  <span>+91 9920511572</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-white/55">
                <Clock size={15} className="text-white/40 stroke-[1.6]" />
                <span className="text-[11px]">Mon – Sat · 10:00 AM – 7:00 PM IST</span>
              </li>
            </ul>
          </div>

          {/* 4. Trust & Security */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 mb-4">
              Integrity
            </h3>
            <div className="bg-white/[0.04] border border-white/10 rounded-sm p-4 space-y-2">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck size={16} className="text-brand-olive stroke-[1.8]" />
                <span className="text-[11px] font-semibold tracking-wider uppercase">
                  Encrypted Checkout
                </span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed font-light">
                All digital transactions are processed securely via <strong className="text-white/80 font-normal">Razorpay</strong> with 256-bit encryption.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40 font-light">
          <p>© {new Date().getFullYear()} THKR Futuretech Pvt. Ltd. All rights reserved.</p>
          <span className="tracking-widest uppercase text-[10px] text-white/30">
            Handcrafted with precision in India
          </span>
        </div>
      </div>
    </footer>
  );
}