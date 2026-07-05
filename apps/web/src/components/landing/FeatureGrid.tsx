"use client";

import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, MessageSquare, Bot, Clock } from "lucide-react";

const features = [
  {
    title: "AI Booking Assistant",
    description: "Our WhatsApp AI naturally talks to clients, answers FAQs, and books appointments 24/7.",
    icon: <Bot className="h-6 w-6 text-purple-400" />,
    colSpan: "md:col-span-2",
    bgClass: "bg-gradient-to-br from-purple-900/40 to-neutral-900",
  },
  {
    title: "Smart Calendar",
    description: "Drag & drop scheduling with conflict prevention.",
    icon: <Calendar className="h-6 w-6 text-blue-400" />,
    colSpan: "md:col-span-1",
    bgClass: "bg-neutral-900",
  },
  {
    title: "Client CRM",
    description: "Track preferences, formulas, and visit history perfectly.",
    icon: <Users className="h-6 w-6 text-emerald-400" />,
    colSpan: "md:col-span-1",
    bgClass: "bg-neutral-900",
  },
  {
    title: "Omnichannel Inbox",
    description: "Manage WhatsApp, Instagram, and web chats from a single dashboard.",
    icon: <MessageSquare className="h-6 w-6 text-pink-400" />,
    colSpan: "md:col-span-2",
    bgClass: "bg-gradient-to-br from-pink-900/40 to-neutral-900",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24 bg-neutral-950 relative overflow-hidden" id="features">
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-3xl md:text-5xl font-bold tracking-tighter text-white"
          >
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">grow</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="max-w-[700px] text-neutral-400 md:text-lg"
          >
            Built specifically for the needs of modern salons, barbershops, and spas. 
            No clunky software, just elegant tools.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`rounded-3xl border border-neutral-800 p-8 flex flex-col justify-between overflow-hidden relative group ${feature.colSpan} ${feature.bgClass}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-neutral-950/50 flex items-center justify-center border border-neutral-800 mb-6 backdrop-blur-sm">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
