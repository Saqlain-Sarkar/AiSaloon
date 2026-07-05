"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Sarah Jenkins",
    role: "Bride",
    content: "The Hair Edit transformed me for my wedding day. The attention to detail and the luxury environment made me feel like royalty. Highly recommend their bridal styling and facials!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Entrepreneur",
    content: "Finding a premium unisex salon that actually understands modern grooming was tough until I found this place. The scalp treatment and precision cut were phenomenal.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Fashion Model",
    content: "I trust them implicitly with my hair color. The balayage technique they use is seamless, and my hair always feels healthier after I leave.",
    rating: 5,
  }
];

export default function Testimonials() {
  return (
    <section className="py-32 bg-[#1A1A1A] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brown/10 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-ivory mb-4">
            Voices of Elegance
          </h2>
          <p className="text-beige font-light">
            Hear from our esteemed clientele.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.8 }}
              className="glass p-8 rounded-2xl flex flex-col relative"
            >
              <div className="text-gold absolute top-6 right-6 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21L16.418 12.001H11.988V3H21V12.001L18.598 21H14.017ZM4.017 21L6.418 12.001H1.988V3H11V12.001L8.598 21H4.017Z" />
                </svg>
              </div>
              <div className="flex gap-1 mb-6 text-gold">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-ivory/90 font-light italic mb-8 flex-grow leading-relaxed">
                "{review.content}"
              </p>
              <div>
                <h4 className="font-serif text-gold text-lg">{review.name}</h4>
                <span className="text-beige text-xs uppercase tracking-wider">{review.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
