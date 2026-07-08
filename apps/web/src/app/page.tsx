import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmoothScroller } from "@/components/landing/SmoothScroller";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Marquee } from "@/components/landing/Marquee";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <SmoothScroller>
      <div className="flex flex-col min-h-screen bg-[#050505] text-neutral-50 selection:bg-amber-500/30">
        
        {/* Glassmorphic Navbar */}
        <header className="fixed top-0 inset-x-0 h-20 flex items-center px-6 lg:px-14 border-b border-white/5 bg-[#0A0A0A]/70 backdrop-blur-xl z-50">
          <Link className="flex items-center justify-center gap-2 group" href="/">
            <Sparkles className="w-6 h-6 text-amber-500 group-hover:text-amber-400 transition-colors" />
            <span className="font-extrabold text-2xl tracking-tighter text-white">AiSalon<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">OS</span></span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-8 items-center">
            <Link className="text-sm font-medium text-neutral-400 hover:text-white transition-colors hidden sm:block" href="#features">
              Features
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10 font-medium">Log in</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:opacity-90 rounded-full font-semibold shadow-[0_0_15px_rgba(217,119,6,0.3)] border-0 px-6">Start Free</Button>
            </Link>
          </nav>
        </header>

        <main className="flex-1">
          <HeroSection />
          <Marquee />
          <ScrollStory />
          <FeatureGrid />
          
          {/* Bottom CTA */}
          <section className="py-40 relative overflow-hidden flex flex-col items-center justify-center text-center bg-[#050505]">
            <div className="absolute inset-0 bg-amber-600/10 blur-[120px] z-0" />
            <div className="relative z-10 space-y-8 px-4">
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
                Ready to automate your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">salon's growth?</span>
              </h2>
              <p className="text-xl text-neutral-400 max-w-[600px] mx-auto font-light">
                Join hundreds of premium salons using AI to handle their scheduling, customer support, and CRM.
              </p>
              <div className="pt-8">
                <Link href="/auth/register">
                  <Button size="lg" className="h-16 px-12 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:opacity-90 rounded-full shadow-[0_0_40px_rgba(217,119,6,0.4)] transition-all hover:shadow-[0_0_60px_rgba(217,119,6,0.6)] border-0 hover:scale-105">
                    Start Your 7-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="flex flex-col gap-2 sm:flex-row py-10 w-full shrink-0 items-center px-4 md:px-14 border-t border-white/5 bg-[#050505] relative z-10">
          <p className="text-sm text-neutral-500">© 2026 AiSalonOS. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-8">
            <Link className="text-sm hover:text-amber-500 transition-colors text-neutral-500" href="#">
              Terms of Service
            </Link>
            <Link className="text-sm hover:text-amber-500 transition-colors text-neutral-500" href="#">
              Privacy Policy
            </Link>
          </nav>
        </footer>
      </div>
    </SmoothScroller>
  );
}
