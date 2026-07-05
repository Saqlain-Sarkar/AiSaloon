"use client";

import { motion } from "framer-motion";

export default function EnvironmentWalkthrough() {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-ivory mb-4">
            Our Luxury Environment
          </h2>
          <p className="text-beige max-w-2xl mx-auto font-light">
            Step into a world of elegance. A space designed to make you feel relaxed, rejuvenated, and pampered.
          </p>
        </div>

        {/* 3D Walkthrough Placeholder */}
        <div className="w-full h-[60vh] glass rounded-2xl overflow-hidden relative group cursor-pointer flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          
          <div className="relative z-20 flex flex-col items-center">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 rounded-full bg-gold/20 backdrop-blur-md border border-gold flex items-center justify-center mb-6"
            >
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-gold border-b-8 border-b-transparent ml-1"></div>
            </motion.div>
            <h3 className="text-3xl font-serif text-ivory tracking-wider">Start Virtual Tour</h3>
          </div>
        </div>
      </div>
    </section>
  );
}
