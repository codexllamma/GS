
import { motion } from "framer-motion";

export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 py-16 px-6 md:px-24 relative overflow-hidden">
      {/* Subtle background motion */}
      <motion.div
        initial={{ opacity: 0.05, scale: 0.9 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-amber-200 to-orange-200 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0.05, scale: 1.1 }}
        animate={{ opacity: 0.1, scale: 0.9 }}
        transition={{ duration: 7, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-orange-100 to-amber-100 rounded-full blur-3xl"
      />

      <div className="relative z-10 max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 text-center bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-justify">
          {children}
        </div>
      </div>
    </div>
  );
}
