"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function Marquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Simple infinite horizontal marquee with GSAP
    gsap.to(containerRef.current, {
      xPercent: -50,
      ease: "none",
      duration: 20,
      repeat: -1,
    });
  }, { scope: containerRef });

  return (
    <div className="w-full overflow-hidden bg-purple-600/10 border-y border-purple-500/20 py-4 flex items-center">
      <div className="flex whitespace-nowrap min-w-max" ref={containerRef}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-16 px-8 items-center text-sm font-semibold uppercase tracking-widest text-purple-300/60">
            <span>Trusted by 500+ top salons</span>
            <span className="w-2 h-2 rounded-full bg-purple-500/40" />
            <span>Over 10,000 appointments booked</span>
            <span className="w-2 h-2 rounded-full bg-purple-500/40" />
            <span>24/7 AI Availability</span>
            <span className="w-2 h-2 rounded-full bg-purple-500/40" />
            <span>Automated CRM</span>
            <span className="w-2 h-2 rounded-full bg-purple-500/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
