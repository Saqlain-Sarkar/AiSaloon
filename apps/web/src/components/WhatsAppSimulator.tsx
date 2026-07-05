"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ChevronLeft, Phone, Video, MoreVertical, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  text: string;
  sender: "bot" | "user";
  time: string;
  status?: "sent" | "delivered" | "read";
};

export function WhatsAppSimulator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = (text: string, delayMs: number = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, delayMs);
  };

  // Initial greeting
  useEffect(() => {
    if (step === 0) {
      addBotMessage("Hi Sarah! Welcome to SalonFlow ✂️ How can we help you today?", 1000);
      setTimeout(() => {
        addBotMessage("Please select a service:\n1. Classic Haircut\n2. Hair Coloring\n3. Balayage\n4. Styling", 1500);
        setStep(1);
      }, 2500);
    }
  }, [step]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMsg = inputValue.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: userMsg,
        sender: "user",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "read"
      }
    ]);
    setInputValue("");

    // Bot response logic based on current step
    if (step === 1) {
      addBotMessage(`Great choice! What time would you like to book on Oct 24?`, 1500);
      setStep(2);
    } else if (step === 2) {
      addBotMessage(`Your appointment is confirmed for Oct 24 at ${userMsg} ✅ We'll see you then!`, 1500);
      setStep(3);
      
      // Auto-trigger the follow up messages to demonstrate the rest of the flow
      setTimeout(() => {
        addBotMessage(`Hi Sarah, this is a reminder for your appointment tomorrow at ${userMsg}. Reply 'C' to cancel or 'R' to reschedule.`, 2000);
      }, 5000);

      setTimeout(() => {
        addBotMessage(`Thanks for visiting SalonFlow! How was your experience? Reply with 1-5 stars ⭐`, 2000);
        setStep(4);
      }, 10000);
    } else if (step === 4) {
      addBotMessage(`Thank you for your feedback! Have a wonderful day.`, 1000);
      setStep(5);
    } else if (step === 5) {
      addBotMessage(`If you need anything else, just say "Hi"!`, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[350px] h-[650px] bg-black rounded-[40px] shadow-2xl p-3 border-4 border-zinc-800 overflow-hidden ring-4 ring-zinc-900/10">
      {/* Dynamic Island / Notch Mockup */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
        <div className="w-32 h-5 bg-black rounded-b-2xl"></div>
      </div>

      <div className="relative flex flex-col w-full h-full bg-[#efeae2] rounded-[32px] overflow-hidden">
        {/* WhatsApp Header */}
        <div className="flex items-center justify-between bg-[#075e54] text-white px-3 py-3 pt-8 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-6 w-6 -ml-1 cursor-pointer" />
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#075e54] font-bold text-lg">
                SF
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#075e54] rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] leading-tight">SalonFlow Bot</span>
              <span className="text-[11px] text-white/80 leading-tight">
                {isTyping ? "typing..." : "online"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Video className="h-5 w-5" />
            <Phone className="h-5 w-5" />
            <MoreVertical className="h-5 w-5" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative pb-20 scrollbar-hide">
          <div className="flex justify-center mb-4">
            <span className="bg-[#e1f3fb] text-[#5e7785] text-xs px-3 py-1 rounded-lg font-medium shadow-sm">
              Today
            </span>
          </div>

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "flex w-full",
                  msg.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative max-w-[85%] rounded-2xl px-3 py-2 text-[14px] shadow-sm leading-relaxed whitespace-pre-wrap",
                    msg.sender === "user"
                      ? "bg-[#dcf8c6] text-zinc-900 rounded-tr-none"
                      : "bg-white text-zinc-900 rounded-tl-none"
                  )}
                >
                  <span className="break-words">{msg.text}</span>
                  <div className="flex items-center justify-end gap-1 mt-1 -mb-1">
                    <span className="text-[10px] text-zinc-500 font-medium">{msg.time}</span>
                    {msg.sender === "user" && (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full justify-start"
            >
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 inset-x-0 bg-[#f0f0f0] p-2 flex items-center gap-2 z-10">
          <div className="flex-1 bg-white rounded-full h-10 px-4 flex items-center shadow-sm relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full h-full outline-none text-sm text-zinc-800 bg-transparent"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 bg-[#00a884] disabled:bg-zinc-400 rounded-full flex items-center justify-center shadow-sm text-white flex-shrink-0 transition-colors"
          >
            <Send className="w-4 h-4 translate-x-px" />
          </button>
        </div>
      </div>
    </div>
  );
}
