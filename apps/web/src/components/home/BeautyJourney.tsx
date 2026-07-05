"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function BeautyJourney() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  
  const y2 = useTransform(scrollYProgress, [0, 1], [250, -250]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full py-32 min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#6B4F3A]/30 via-black to-black"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center flex flex-col gap-40">
        <motion.h2
          style={{ y: y1, opacity: opacity1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#F7F1EA] max-w-4xl mx-auto"
        >
          Every <span className="italic text-gradient">transformation</span> begins with confidence.
        </motion.h2>

        <motion.h2
          style={{ y: y2, opacity: opacity2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#F7F1EA] max-w-4xl mx-auto"
        >
          Every confidence begins with <span className="italic text-gradient">self-care</span>.
        </motion.h2>
      </div>
    </section>
  );
}
