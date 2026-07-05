"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function BeforeAfter() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <section className="py-32 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-ivory mb-4">
            The Transformation
          </h2>
          <p className="text-beige max-w-2xl mx-auto font-light">
            Slide to reveal the before and after of our signature hair treatments.
          </p>
        </div>

        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative w-full max-w-4xl aspect-[16/9] rounded-2xl overflow-hidden cursor-ew-resize select-none glass"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleMove(e.touches[0].clientX);
            }}
          >
            {/* After Image (Background) */}
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
              {/* Placeholder for After image */}
              <div className="text-gold font-serif text-3xl opacity-50">AFTER</div>
            </div>

            {/* Before Image (Clipped) */}
            <div
              className="absolute inset-0 bg-zinc-900 flex items-center justify-center overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              {/* Placeholder for Before image */}
              <div className="text-ivory font-serif text-3xl opacity-50">BEFORE</div>
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gold cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-8 h-8 bg-black border-2 border-gold rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(201,168,118,0.5)]">
                <div className="w-4 h-4 text-gold flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
