"use client";

import { motion } from "framer-motion";

export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white py-20 px-4 md:px-12 relative overflow-hidden font-apercu">
      
      {/* --- BACKGROUND ANIMATION LAYER --- */}
      {/* Top Left Blob - Soft Sky */}
      <motion.div
        initial={{ opacity: 0.4, scale: 0.8, x: -50 }}
        animate={{ opacity: 0.6, scale: 1.1, x: 50 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-200/30 rounded-full blur-[120px] pointer-events-none"
      />
      
      {/* Bottom Right Blob - Deep Blue */}
      <motion.div
        initial={{ opacity: 0.3, scale: 1.1, y: 50 }}
        animate={{ opacity: 0.5, scale: 0.9, y: -50 }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"
      />

      {/* --- MAIN CARD --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 md:p-16">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {/* Decorative Divider */}
            <div className="h-1 w-20 bg-blue-900/10 mx-auto mt-6 rounded-full" />
          </div>

          {/* Content - Customizing Tailwind Typography (Prose) */}
          <div className="prose prose-lg prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
            prose-p:text-gray-600 prose-p:leading-8
            prose-a:text-blue-600 prose-a:font-medium hover:prose-a:text-blue-800 prose-a:transition-colors
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-gray-600
            prose-li:marker:text-blue-300
          ">
            {children}
          </div>

        </div>

        {/* Footer Copyright Hint */}
        <div className="mt-8 text-center">
           <p className="text-sm text-gray-400 font-medium">
             &copy; 2025 THKR Futuretech Pvt. Ltd.
           </p>
        </div>

      </motion.div>
    </div>
  );
}