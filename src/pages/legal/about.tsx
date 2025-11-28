"use client";

import LegalLayout from "@/components/legalLayout";
import { motion } from "framer-motion";

export default function AboutPage() {
  const values = [
    {
      title: "Quality First",
      description: "We handpick the finest fabrics and use precise construction to ensure lasting comfort and durability."
    },
    {
      title: "Timeless Design",
      description: "Minimal, refined, and versatile—our pieces stay relevant across seasons and occasions."
    },
    {
      title: "Comfort Without Compromise",
      description: "Every garment is engineered to feel as good as it looks, with fits that move naturally and confidently."
    },
    {
      title: "Honest Craftsmanship",
      description: "No shortcuts. No unnecessary embellishments. Just pure, intentional design that reflects our commitment to excellence."
    },
    {
      title: "Quiet Confidence",
      description: "We create clothing that empowers you to stand out subtly—through elegance, not excess."
    },
    {
      title: "Always Improving",
      description: "At HIÈR, we stay humble. Every collection teaches us something new. We listen, refine, and continuously elevate our craft."
    }
  ];

  return (
    <LegalLayout title="About HIÈR">
      {/* We wrap the content in the blue gradient theme. 
          The -m-4 or -p-4 logic depends on your LegalLayout padding, 
          but here is the self-contained styled block.
      */}
      <div className="font-apercu text-gray-900 bg-gradient-to-br from-blue-100 via-white to-blue-50 rounded-xl p-6 md:p-12 shadow-sm border border-blue-100/50">
        
        {/* HEADER & INTRO */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Refined Craftsmanship. <br />
            <span className="text-blue-900">Everyday Elegance.</span>
          </h2>
          
          <div className="text-lg leading-relaxed text-gray-700 space-y-6 text-left md:text-center">
            <p>
              <span className="font-semibold text-black">HIÈR</span> is where refined craftsmanship meets everyday elegance. 
              We create premium shirts, polos, and trousers using carefully selected fabrics, modern silhouettes, and minimal design. 
              Every piece is made to feel luxurious, fit flawlessly, and elevate your daily style—without ever being loud or excessive.
            </p>
            <p>
              At HIÈR, we believe style should be effortless, timeless, and rooted in quality. 
              Our clothing is crafted for individuals who value comfort, confidence, and quiet sophistication.
            </p>
          </div>
        </motion.div>

        {/* VALUES SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-center mb-10 text-blue-900">Our Values</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white/60 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/80"
              >
                <h4 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                  <span className="text-blue-500/50 font-mono text-sm">0{idx + 1}.</span> 
                  {item.title}
                </h4>
                <p className="text-gray-700 leading-relaxed text-[15px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FOOTER QUOTE */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center border-t border-blue-200/50 pt-10"
        >
          <p className="text-xl md:text-2xl font-medium text-gray-500 italic font-serif">
            "Perfection is a journey, and we aim to get closer with every stitch."
          </p>
        </motion.div>

      </div>
    </LegalLayout>
  );
}