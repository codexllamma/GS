import AnimatedLogo from "@/components/animatedLogo";
import Logo from "@/components/logo";
import { ArrowRight, Sparkles, Users } from "lucide-react";

export default function LandingPage() {
  
  return (
    <div className="min-h-screen bg-white text-black">

      
      <header className="max-w-7xl mx-auto py-4 flex items-center justify-center">
        <AnimatedLogo />
      </header>

      
      <section className="relative w-full h-[100vh] overflow-hidden bg-black">

        
        <video
          src="/hero.mp4"  // Replace this later with real video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />

        {/* Stylized Placeholder (shows if video is missing) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="text-center text-white/40">
            <div className="text-6xl mb-4">▶</div>
            <p className="text-sm tracking-[0.25em]">VIDEO PLACEHOLDER</p>
          </div>
        </div>

        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Centered Brand Title */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-6xl md:text-8xl font-light tracking-tight">
            <Logo/>
          </h1>
        </div>

        {/* CTA bottom-right */}
        <div className="absolute bottom-10 right-10">
          <button className="group flex items-center gap-2 text-white/90 text-lg font-light">
            <span className="group-hover:text-white transition-colors">
              Explore Collection
            </span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </section>

      {/* ---------------- BRAND STATEMENT ---------------- */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-2xl md:text-3xl leading-relaxed font-light">
            To wear <span className="font-normal text-black">ĦIÈR</span> is to wear{" "}
            <span className="text-black font-normal">heritage</span>—
          </p>
          <p className="text-2xl md:text-3xl leading-relaxed font-light mt-4">
            a signature of <span className="text-black font-normal">discretion</span>,
          </p>
          <p className="text-2xl md:text-3xl leading-relaxed font-light mt-4">
            a silent emblem of belonging to the few who{" "}
            <span className="text-black font-normal">truly know</span>.
          </p>
        </div>

        {/* 3-CARD SECTION */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {/* Card 1 */}
          <div className="group">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-normal mb-3">Explore Collection</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Discover our curated selection of timeless pieces crafted for
                those who appreciate refined elegance.
              </p>
              <button className="flex items-center gap-2 text-black font-light hover:gap-3 transition-all group">
                View Collection
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <span className="text-white font-bold text-xl">Ġ</span>
              </div>
              <h3 className="text-xl font-normal mb-3">Learn More</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Understand the philosophy behind ĦIÈR and the meticulous
                craftsmanship defining every garment.
              </p>
              <button className="flex items-center gap-2 text-black font-light hover:gap-3 transition-all group">
                Our Story
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group">
            <div className="bg-white p-8 rounded-sm border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-black mb-6 rounded-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-normal mb-3">Join Now</h3>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                Become part of an exclusive circle — early access, private
                events, and personalized service.
              </p>
              <button className="flex items-center gap-2 text-black font-light hover:gap-3 transition-all group">
                Join Circle
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- BOTTOM STATEMENT BLOCK ---------------- */}
      <section className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block mb-8">
            <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-3xl">Ġ</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-light mb-6">For The Few Who Know</h2>

          <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            Excellence is not announced. It is recognized by those who understand its
            language — spoken through fabric, cut, and the quiet confidence of impeccable taste. 
          </p>
        </div>
      </section>
    </div>
  );
}
