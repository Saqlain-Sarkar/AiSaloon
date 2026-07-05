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
      <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 selection:bg-purple-500/30">
        
        {/* Glassmorphic Navbar */}
        <header className="fixed top-0 inset-x-0 h-20 flex items-center px-6 lg:px-14 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl z-50">
          <Link className="flex items-center justify-center gap-2" href="/">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="font-bold text-2xl tracking-tighter text-white">AiSalon<span className="text-purple-500">OS</span></span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
            <Link className="text-sm font-medium text-neutral-400 hover:text-white transition-colors" href="#features">
              Features
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10">Log in</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-white text-black hover:bg-neutral-200 rounded-full font-medium">Start Free</Button>
            </Link>
          </nav>
        </header>

        <main className="flex-1">
          <HeroSection />
          <Marquee />
          <ScrollStory />
          <FeatureGrid />
          
          {/* Bottom CTA */}
          <section className="py-32 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute inset-0 bg-purple-900/20 blur-[100px] z-0" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                Ready to automate?
              </h2>
              <p className="text-xl text-neutral-400 max-w-[500px] mx-auto">
                Join hundreds of premium salons using AI to handle their scheduling.
              </p>
              <div className="pt-8">
                <Link href="/auth/register">
                  <Button size="lg" className="h-14 px-10 text-lg bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]">
                    Create Your Account
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-14 border-t border-white/5 bg-neutral-950">
          <p className="text-sm text-neutral-500">© 2026 AiSalonOS. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link className="text-sm hover:text-white transition-colors text-neutral-500" href="#">
              Terms of Service
            </Link>
            <Link className="text-sm hover:text-white transition-colors text-neutral-500" href="#">
              Privacy Policy
            </Link>
          </nav>
        </footer>
      </div>
    </SmoothScroller>
  );
}
