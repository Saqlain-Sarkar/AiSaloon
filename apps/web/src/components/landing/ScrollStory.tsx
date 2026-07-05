"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CheckCircle2, XCircle } from "lucide-react";

export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=150%", 
        pin: true,
        scrub: 1,
      },
    });

    // Fade out problem, fade in solution
    tl.to(problemRef.current, { opacity: 0, y: -50, duration: 1 })
      .to(solutionRef.current, { opacity: 1, y: 0, duration: 1 }, "-=0.5");
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="h-screen w-full bg-neutral-950 flex items-center justify-center overflow-hidden border-t border-b border-neutral-900">
      <div className="container relative px-4 md:px-6 h-full flex items-center justify-center">
        
        {/* The Problem */}
        <div ref={problemRef} className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="inline-block rounded-full bg-red-950/50 border border-red-900 px-4 py-1.5 text-sm text-red-400 font-medium mb-6 backdrop-blur-md">
            The Old Way
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-neutral-300 max-w-3xl">
            Are you losing customers in your DMs?
          </h2>
          <ul className="mt-10 space-y-4 text-left max-w-md mx-auto">
            <li className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-neutral-400">
              <XCircle className="text-red-500 h-6 w-6 flex-shrink-0" />
              <span>Missed messages during busy hours</span>
            </li>
            <li className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-neutral-400">
              <XCircle className="text-red-500 h-6 w-6 flex-shrink-0" />
              <span>Accidental double bookings</span>
            </li>
          </ul>
        </div>

        {/* The Solution */}
        <div 
          ref={solutionRef} 
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
          style={{ opacity: 0, transform: "translateY(50px)" }}
        >
          <div className="inline-block rounded-full bg-green-950/50 border border-green-900 px-4 py-1.5 text-sm text-green-400 font-medium mb-6 backdrop-blur-md">
            The AiSalonOS Way
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white max-w-3xl">
            Automated, professional bookings.
          </h2>
          <ul className="mt-10 space-y-4 text-left max-w-md mx-auto">
            <li className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 shadow-2xl shadow-green-900/20">
              <CheckCircle2 className="text-green-500 h-6 w-6 flex-shrink-0" />
              <span>AI handles your WhatsApp 24/7</span>
            </li>
            <li className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 shadow-2xl shadow-green-900/20">
              <CheckCircle2 className="text-green-500 h-6 w-6 flex-shrink-0" />
              <span>Flawless real-time calendar sync</span>
            </li>
          </ul>
        </div>

      </div>
    </section>
  );
}
