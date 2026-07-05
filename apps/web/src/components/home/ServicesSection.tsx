"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const SERVICES = [
  {
    title: "Hair Cutting & Styling",
    desc: "Precision cuts and modern styles tailored to your personality.",
    image: "/images/hair-cut.jpg", // Placeholder
  },
  {
    title: "Luxury Hair Spa",
    desc: "Rejuvenating treatments for ultimate scalp and hair health.",
    image: "/images/hair-spa.jpg",
  },
  {
    title: "Advanced Coloring",
    desc: "Balayage, highlights, and global coloring with premium products.",
    image: "/images/hair-color.jpg",
  },
  {
    title: "Skin & Beauty",
    desc: "Glowing facials and essential beauty treatments.",
    image: "/images/skin-care.jpg",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-24 bg-black relative z-10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-ivory mb-4">Our Premium Services</h2>
          <p className="text-beige max-w-2xl mx-auto font-light">
            Experience the pinnacle of luxury with our curated selection of hair, skin, and grooming treatments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="glass rounded-2xl p-6 flex flex-col group cursor-pointer relative overflow-hidden h-[400px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
              
              {/* Image Placeholder (would be actual Image component) */}
              <div className="absolute inset-0 bg-brown/20 group-hover:scale-110 transition-transform duration-700"></div>

              <div className="relative z-20 mt-auto flex flex-col">
                <h3 className="text-2xl font-serif text-gold mb-2">{service.title}</h3>
                <p className="text-ivory/80 text-sm font-light mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                  {service.desc}
                </p>
                <Link
                  href="/services"
                  className="text-xs uppercase tracking-widest text-ivory hover:text-gold transition-colors self-start pb-1 border-b border-gold/30 hover:border-gold"
                >
                  Discover More
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
