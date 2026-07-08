"use client";

import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, MessageSquare, Bot, Clock } from "lucide-react";

const features = [
  {
    title: "AI Receptionist (WhatsApp)",
    description: "Our AI naturally talks to clients in Hindi, English & Gujarati. It answers FAQs and secures bookings 24/7.",
    icon: <Bot className="h-6 w-6 text-amber-500 group-hover:text-amber-400 transition-colors" />,
    colSpan: "md:col-span-2",
    bgClass: "bg-gradient-to-br from-amber-900/20 to-[#111111]",
    borderClass: "border-amber-900/30 hover:border-amber-500/50",
  },
  {
    title: "Smart Calendar",
    description: "Elegant scheduling that prevents double bookings instantly.",
    icon: <Calendar className="h-6 w-6 text-yellow-500 group-hover:text-yellow-400 transition-colors" />,
    colSpan: "md:col-span-1",
    bgClass: "bg-[#111111]",
    borderClass: "border-neutral-800 hover:border-yellow-500/50",
  },
  {
    title: "Premium CRM",
    description: "Track VIP client preferences, past visits, and revenue effortlessly.",
    icon: <Users className="h-6 w-6 text-amber-600 group-hover:text-amber-500 transition-colors" />,
    colSpan: "md:col-span-1",
    bgClass: "bg-[#111111]",
    borderClass: "border-neutral-800 hover:border-amber-500/50",
  },
  {
    title: "Unified Inbox",
    description: "Manage all your customer conversations from a single beautiful dashboard.",
    icon: <MessageSquare className="h-6 w-6 text-yellow-600 group-hover:text-yellow-500 transition-colors" />,
    colSpan: "md:col-span-2",
    bgClass: "bg-gradient-to-br from-yellow-900/20 to-[#111111]",
    borderClass: "border-yellow-900/30 hover:border-yellow-500/50",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24 bg-[#0A0A0A] relative overflow-hidden" id="features">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white"
          >
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">scale</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-[700px] text-neutral-400 md:text-lg font-light"
          >
            Built specifically for premium salons and spas. Stop missing bookings and start growing your revenue automatically.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className={`rounded-3xl border p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(217,119,6,0.15)] ${feature.colSpan} ${feature.bgClass} ${feature.borderClass}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-[#0A0A0A] flex items-center justify-center border border-neutral-800 mb-6 group-hover:border-amber-900/50 transition-colors shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-amber-50 transition-colors">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed font-light">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Section CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-20 flex justify-center"
        >
          <a href="/auth/register" className="inline-flex items-center justify-center h-14 px-10 text-lg font-semibold rounded-full bg-[#111111] text-amber-500 border border-amber-900/50 hover:bg-amber-500 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.1)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)]">
            Explore All Features
            <TrendingUp className="ml-2 h-5 w-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
