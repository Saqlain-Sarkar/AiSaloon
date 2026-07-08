"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden bg-[#0A0A0A] pt-32 pb-20">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[128px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-yellow-600/10 rounded-full blur-[128px] mix-blend-screen" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5" />
      </div>

      <motion.div
        className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <div className="inline-flex items-center rounded-full border border-amber-900/50 bg-[#111111]/80 px-4 py-1.5 text-sm text-neutral-300 backdrop-blur-md shadow-[0_0_15px_rgba(217,119,6,0.1)]">
            <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
            <span className="font-medium tracking-wide">The Future of Premium Salon Management</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="max-w-4xl space-y-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white">
            The intelligent OS for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-yellow-600">
              luxury salons
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg md:text-xl text-neutral-400 font-light leading-relaxed mt-6">
            Turn WhatsApp inquiries into confirmed appointments effortlessly. 
            AiSalonOS is the premium CRM and automated booking platform that never sleeps.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <Link href="/auth/register">
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:opacity-90 rounded-full group transition-all shadow-[0_0_30px_rgba(217,119,6,0.3)] hover:shadow-[0_0_40px_rgba(217,119,6,0.5)] border-0">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-base font-medium border-neutral-700/50 bg-[#111111]/50 text-white hover:bg-[#1A1A1A] hover:border-neutral-600 rounded-full backdrop-blur-sm transition-all">
              Watch Demo
            </Button>
          </Link>
        </motion.div>
        
        {/* Dashboard Preview Mockup */}
        <motion.div 
          variants={itemVariants}
          className="mt-24 w-full max-w-5xl mx-auto rounded-2xl border border-neutral-800/60 bg-[#0F0F0F] p-3 shadow-2xl backdrop-blur-md"
        >
          <div className="rounded-xl overflow-hidden bg-[#050505] aspect-video flex flex-col relative border border-neutral-800/40">
            {/* Header */}
            <div className="h-16 border-b border-neutral-900 flex items-center px-6 justify-between bg-[#0A0A0A]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-800"></div>
                <div className="w-3 h-3 rounded-full bg-neutral-800"></div>
                <div className="w-3 h-3 rounded-full bg-neutral-800"></div>
              </div>
              <div className="h-8 w-64 bg-[#111] rounded-md border border-neutral-800/50 flex items-center px-4">
                 <div className="w-32 h-2 bg-neutral-800 rounded-full"></div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 opacity-80"></div>
              </div>
            </div>
            
            {/* Content Body */}
            <div className="flex-1 flex p-6 gap-6">
              {/* Sidebar */}
              <div className="w-48 hidden md:flex flex-col gap-4">
                <div className="h-8 bg-amber-500/10 rounded-md border border-amber-500/20 flex items-center px-3">
                   <div className="w-20 h-2 bg-amber-500/50 rounded-full"></div>
                </div>
                <div className="h-8 bg-[#111] rounded-md flex items-center px-3">
                   <div className="w-24 h-2 bg-neutral-800 rounded-full"></div>
                </div>
                <div className="h-8 bg-[#111] rounded-md flex items-center px-3">
                   <div className="w-16 h-2 bg-neutral-800 rounded-full"></div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-28 bg-gradient-to-br from-[#111] to-[#0A0A0A] rounded-xl border border-neutral-800/50 p-4 flex flex-col justify-between">
                    <div className="w-20 h-3 bg-neutral-800 rounded-full"></div>
                    <div className="w-32 h-6 bg-amber-500/90 rounded-full"></div>
                  </div>
                  <div className="h-28 bg-gradient-to-br from-[#111] to-[#0A0A0A] rounded-xl border border-neutral-800/50 p-4 flex flex-col justify-between">
                    <div className="w-24 h-3 bg-neutral-800 rounded-full"></div>
                    <div className="w-28 h-6 bg-white/90 rounded-full"></div>
                  </div>
                  <div className="h-28 bg-gradient-to-br from-[#111] to-[#0A0A0A] rounded-xl border border-neutral-800/50 p-4 flex flex-col justify-between">
                    <div className="w-16 h-3 bg-neutral-800 rounded-full"></div>
                    <div className="w-24 h-6 bg-white/90 rounded-full"></div>
                  </div>
                </div>
                
                {/* Large Chart/Calendar Area */}
                <div className="flex-1 bg-gradient-to-br from-[#111] to-[#0A0A0A] rounded-xl border border-neutral-800/50 p-6 flex flex-col gap-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/5 rounded-full blur-[80px]"></div>
                   <div className="w-40 h-4 bg-neutral-800 rounded-full mb-4"></div>
                   
                   {/* Fake Calendar Rows */}
                   <div className="flex-1 flex flex-col gap-3">
                     <div className="h-12 bg-[#1A1A1A] rounded-lg flex items-center px-4 gap-4">
                        <div className="w-12 h-12 bg-neutral-900 rounded-md"></div>
                        <div className="flex-1 h-3 bg-neutral-800 rounded-full"></div>
                        <div className="w-24 h-6 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider">CONFIRMED</div>
                     </div>
                     <div className="h-12 bg-[#1A1A1A] rounded-lg flex items-center px-4 gap-4">
                        <div className="w-12 h-12 bg-neutral-900 rounded-md"></div>
                        <div className="flex-1 h-3 bg-neutral-800 rounded-full"></div>
                        <div className="w-24 h-6 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider">CONFIRMED</div>
                     </div>
                     <div className="h-12 bg-[#1A1A1A] rounded-lg flex items-center px-4 gap-4">
                        <div className="w-12 h-12 bg-neutral-900 rounded-md"></div>
                        <div className="flex-1 h-3 bg-neutral-800 rounded-full opacity-50"></div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
