"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header"; // Assuming you want the header here too
import LegalLayout from "@/components/legalLayout";

// Define the sections for cleaner mapping
const SECTIONS = [
  {
    title: "Selecting Fabrics Fit for Elegance",
    text: "We handpick only the highest-grade fabrics sourced from mills known for their heritage, consistency, and purity of weave. Each fabric undergoes a meticulous evaluation—its strength, breathability, luster, and drape are tested with exacting standards. We choose materials that do not merely impress at first glance but continue to elevate themselves with every wear.",
    subtext: "The result? Fabrics that feel gentle against the skin, move with refined fluidity, and carry a richness that speaks of quiet opulence.",
  },
  {
    title: "Precision Cutting: Where Perfection Takes Shape",
    text: "Great fabric deserves great treatment. Our cutting process is rooted in precision—every measurement, line, and curve is handled with a master’s discipline. Using a blend of advanced techniques and traditional craftsmanship, each panel is shaped to maintain the garment’s structure while enhancing comfort and elegance.",
    subtext: "This precision ensures harmonious symmetry, allowing the final piece to sit flawlessly on the body, complementing every silhouette."
  },
  {
    title: "The Hands That Craft Excellence",
    text: "Our garments are entrusted to tailors who have honed their craft over decades. These artisans understand fabric not just technically but emotionally—they know how it falls, how it breathes, how it wants to live. Their stitches are purposeful, their techniques time-honored, and their attention to detail unwavering.",
    subtext: "From the strength of a seam to the smoothness of a collar roll, every detail is guided by mastery.",
  },
];

export default function CraftsmanshipPage() {
  return (
    <>
      <LegalLayout title="The Art of ĦIÈR" >

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 font-apercu text-gray-900 pt-24 pb-20">
        
        {/* --- HERO HEADER --- */}
        <section className="max-w-5xl mx-auto px-6 mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black mb-8">
              Where Craft Meets Class
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              In a world overflowing with fashion, true luxury reveals itself not in loud statements but in the quiet confidence of impeccable craftsmanship. <br/><br/>
              Every piece we create begins long before a stitch is sewn. It begins with the fabric. Because fabric is not just material; it is the soul of every garment.
            </p>
          </motion.div>
        </section>

        {/* --- ALTERNATING SECTIONS --- */}
        <div className="flex flex-col gap-24 md:gap-32 px-6 md:px-12 max-w-7xl mx-auto">
          {SECTIONS.map((section, idx) => {
            const isEven = idx % 2 === 0;
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className={`flex flex-col md:flex-row items-center gap-10 md:gap-20 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* IMAGE SIDE */}
                

                {/* TEXT SIDE */}
                <div className="w-full md:w-1/2 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-black">
                    {section.title}
                  </h2>
                  <div className="h-1 w-16 bg-blue-900/20 rounded-full" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {section.text}
                  </p>
                  <p className="text-gray-500 font-light italic leading-relaxed border-l-2 border-blue-200 pl-4">
                    {section.subtext}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* --- CONCLUSION BLOCK --- */}
        <section className="mt-32 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/60 backdrop-blur-xl border border-blue-100 p-10 md:p-16 rounded-3xl shadow-lg"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">
              A Feel That Speaks. A Look That Lasts.
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Luxury is not only seen; it is felt. The softness of the fabric, the sharpness of the cut, the elegance in the finishing—each contributes to an experience that stays with the wearer.
              <br/><br/>
              Every shirt, polo, or trouser we create is an ode to those who value heritage, precision, and the quiet sophistication of well-made apparel.
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <span className="text-blue-900 font-semibold text-lg">Because true luxury isn’t loud.</span>
              <span className="text-gray-500 font-serif italic text-xl">It’s felt. It’s lived. And it’s remembered.</span>
            </div>

            <Link href="/product/products">
              <button className="mt-10 bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
                Experience the Quality
              </button>
            </Link>
          </motion.div>
        </section>

      </div>
      </LegalLayout>
      
    </>
  );
}