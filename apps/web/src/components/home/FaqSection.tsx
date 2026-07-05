"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    question: "What is Hair Botox?",
    answer: "Hair Botox is a deep conditioning treatment that coats hair fibers with a filler, such as keratin. It fills in any broken or thin areas on each hair strand to make hair appear more full and lustrous."
  },
  {
    question: "What is Keratin Treatment?",
    answer: "A Keratin Treatment is a chemical process that smooths and shines frizzy hair. Results can last up to 6 months. It works by diving into the hair follicle and injecting porous areas with keratin, an essential hair protein."
  },
  {
    question: "How often should I do a Hair Spa?",
    answer: "For optimal hair health, we recommend a professional Hair Spa treatment once every 15 to 30 days, depending on your hair type, environmental exposure, and styling habits."
  },
  {
    question: "Which facial is best for glowing skin?",
    answer: "Our Signature Luxury Gold Facial is highly recommended for an instant, radiant glow. It utilizes premium botanical extracts and 24k gold particles to brighten, hydrate, and firm the skin."
  },
  {
    question: "How long does hair coloring last?",
    answer: "Professional hair color typically lasts 4 to 6 weeks before fading or showing root growth. Using color-safe, sulfate-free shampoos and regular gloss treatments can extend the vibrancy."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-black relative" id="faq">
      {/* Schema Markup for FAQ Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQS.map((faq) => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />
      <div className="container mx-auto px-6 max-w-4xl z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-ivory mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-beige font-light">
            Expert answers for your beauty journey.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div 
              key={index}
              className="glass rounded-xl overflow-hidden border border-white/10"
            >
              <button
                className="w-full px-6 py-6 text-left flex justify-between items-center focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-serif text-xl text-ivory">{faq.question}</span>
                {openIndex === index ? (
                  <Minus className="text-gold flex-shrink-0" size={24} />
                ) : (
                  <Plus className="text-gold flex-shrink-0" size={24} />
                )}
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-beige font-light leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
