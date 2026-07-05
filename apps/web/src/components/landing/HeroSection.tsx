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
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden bg-neutral-950 pt-32 pb-20">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[128px] mix-blend-screen" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />
      </div>

      <motion.div
        className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <div className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300 backdrop-blur-md">
            <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
            <span>Introducing AI-Powered Bookings</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="max-w-4xl space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
            The intelligent OS for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              modern salons
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg md:text-xl text-neutral-400 leading-relaxed mt-6">
            Turn WhatsApp inquiries into confirmed appointments effortlessly. 
            AiSalonOS is the premium CRM and automated booking platform that never sleeps.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/auth/register">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-white text-black hover:bg-neutral-200 rounded-full group transition-all">
              Start Building Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-neutral-700 text-white hover:bg-neutral-800 rounded-full">
              View Demo
            </Button>
          </Link>
        </motion.div>
        
        {/* Dashboard Preview Mockup */}
        <motion.div 
          variants={itemVariants}
          className="mt-20 w-full max-w-5xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/50 p-2 shadow-2xl backdrop-blur-md"
        >
          <div className="rounded-xl overflow-hidden bg-neutral-950 aspect-video flex items-center justify-center relative border border-neutral-800/50">
            {/* Simulating a dashboard UI with CSS for now */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
            <div className="w-full h-full p-8 flex flex-col gap-6 opacity-60">
              <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-neutral-800 rounded-md" />
                <div className="flex gap-4">
                  <div className="h-8 w-8 bg-neutral-800 rounded-full" />
                  <div className="h-8 w-8 bg-neutral-800 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="h-32 bg-neutral-800 rounded-xl" />
                <div className="h-32 bg-neutral-800 rounded-xl" />
                <div className="h-32 bg-neutral-800 rounded-xl" />
              </div>
              <div className="flex-1 bg-neutral-800 rounded-xl" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
