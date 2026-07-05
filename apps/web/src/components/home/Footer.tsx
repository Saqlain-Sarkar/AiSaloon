"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black relative overflow-hidden pt-32 pb-10 border-t border-white/5">
      {/* Decorative Particle Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(201,168,118,0.15)_0%,_transparent_70%)] blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-24 w-full max-w-4xl"
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-gold font-bold tracking-widest mb-6">
            THE HAIR EDIT
          </h2>
          <p className="text-xl md:text-2xl text-ivory font-light italic mb-12">
            Your Transformation Begins Here
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/book"
              className="px-10 py-5 bg-gold text-black uppercase tracking-widest text-sm font-bold hover:bg-white transition-colors duration-300"
            >
              Book Appointment
            </Link>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noreferrer"
              className="px-10 py-5 border border-gold text-gold uppercase tracking-widest text-sm font-bold hover:bg-gold hover:text-black transition-colors duration-300"
            >
              WhatsApp Now
            </a>
          </div>
        </motion.div>

        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-beige font-light mb-16 border-t border-white/10 pt-16">
          <div className="col-span-1 md:col-span-1 flex flex-col space-y-4">
            <h4 className="text-gold font-serif text-xl mb-2">Location</h4>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gold flex-shrink-0 mt-1" />
              <span>123 Luxury Avenue,<br />Metropolis, NY 12345</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gold flex-shrink-0" />
              <span>+1 (234) 567-890</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gold flex-shrink-0" />
              <span>hello@thehairedit.com</span>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="text-gold font-serif text-xl mb-2">Services</h4>
            <Link href="/services" className="hover:text-gold transition-colors">Hair Styling & Cutting</Link>
            <Link href="/services" className="hover:text-gold transition-colors">Color & Highlights</Link>
            <Link href="/services" className="hover:text-gold transition-colors">Hair Spa & Repair</Link>
            <Link href="/services" className="hover:text-gold transition-colors">Facials & Skincare</Link>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="text-gold font-serif text-xl mb-2">Quick Links</h4>
            <Link href="/about" className="hover:text-gold transition-colors">About Us</Link>
            <Link href="/gallery" className="hover:text-gold transition-colors">Gallery</Link>
            <Link href="/testimonials" className="hover:text-gold transition-colors">Testimonials</Link>
            <Link href="#faq" className="hover:text-gold transition-colors">FAQs</Link>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="text-gold font-serif text-xl mb-2">Connect</h4>
            <p className="mb-4">Follow our journey and discover our latest transformations.</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="w-full text-center text-xs text-white/40 border-t border-white/10 pt-8">
          <p>&copy; {new Date().getFullYear()} The Hair Edit – Luxury Unisex Salon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
