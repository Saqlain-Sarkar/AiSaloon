"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Bot, User, Phone, CheckCheck, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchConversations, fetchConversationById, takeoverChat, sendManualMessage } from "@/lib/api";
import { format } from "date-fns";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await fetchConversations();
        setConversations(data);
        if (data.length > 0) {
          setActiveChat(data[0]);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    async function loadChatDetails() {
      setLoadingChat(true);
      try {
        const details = await fetchConversationById(activeChat.id);
        setChatDetails(details);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (err) {
        console.error("Failed to load chat details", err);
      } finally {
        setLoadingChat(false);
      }
    }
    loadChatDetails();
  }, [activeChat?.id]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const lower = searchTerm.toLowerCase();
    return conversations.filter(c => 
      (c.customer?.name || "").toLowerCase().includes(lower) ||
      (c.customer?.phone || "").includes(lower)
    );
  }, [conversations, searchTerm]);

  const handleTakeoverToggle = async () => {
    if (!activeChat) return;
    const currentStatus = activeChat.isAiManaging ?? true;
    try {
      await takeoverChat(activeChat.id, !currentStatus);
      setActiveChat({ ...activeChat, isAiManaging: !currentStatus });
      setConversations(conversations.map(c => 
        c.id === activeChat.id ? { ...c, isAiManaging: !currentStatus } : c
      ));
    } catch (err) {
      console.error("Failed to toggle AI state", err);
    }
  };

  const handleSendMessage = async () => {
    if (!activeChat || !manualMessage.trim() || sending) return;
    setSending(true);
    try {
      const newMsg = await sendManualMessage(activeChat.id, manualMessage);
      setChatDetails((prev: any) => ({
        ...prev,
        messages: [...(prev?.messages || []), newMsg]
      }));
      setManualMessage("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: any) {
      alert("Failed to send message: " + (e.message || "Unknown error"));
      console.error("Manual Message Error:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar - Conversation List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">AI Inbox</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <Input 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center text-sm text-zinc-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">No conversations found.</div>
          ) : filteredConversations.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`p-3 rounded-xl cursor-pointer transition-colors flex gap-3 ${activeChat?.id === chat.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white font-medium">{(chat.customer?.name || "U").charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-zinc-900 truncate">{chat.customer?.name || "Unknown"}</h3>
                  <span className="text-[10px] text-zinc-500 shrink-0">{format(new Date(chat.updatedAt), "hh:mm a")}</span>
                </div>
                <p className="text-xs text-zinc-600 truncate">{chat._count?.messages || 0} messages</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] border-zinc-200 text-zinc-500 px-1.5 py-0">
                    {chat.source || "WHATSAPP"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium">{(activeChat.customer?.name || "U").charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="font-medium text-zinc-900">{activeChat.customer?.name || "Unknown"}</h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Phone className="w-3 h-3" />
                    {activeChat.customer?.phone || "No phone"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleTakeoverToggle}
                  variant="outline" 
                  size="sm" 
                  className={`border-zinc-200 text-zinc-600 hover:text-zinc-900 hidden sm:flex ${activeChat.isAiManaging === false ? 'bg-zinc-100 hover:bg-zinc-200' : 'hover:bg-zinc-100'}`}
                >
                  {activeChat.isAiManaging === false ? 'Restore AI Bot' : 'Takeover Chat'}
                </Button>
                {activeChat.isAiManaging !== false ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                    <Bot className="w-3 h-3 mr-1" />
                    AI Managing
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20">
                    <User className="w-3 h-3 mr-1" />
                    Human Chat
                  </Badge>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="text-center text-xs text-zinc-500 my-4">
                Conversation started on {activeChat.source || "WHATSAPP"}
              </div>

              {loadingChat ? (
                 <div className="text-center text-sm text-zinc-500 mt-10">Loading messages...</div>
              ) : chatDetails?.messages?.map((msg: any, idx: number) => (
                <motion.div 
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`flex flex-col max-w-[80%] ${msg.role === 'CUSTOMER' ? 'self-start' : 'self-end items-end ml-auto'}`}
                >
                  {msg.role === 'AI' && msg.metadata?.intent && (
                    <div className="flex items-center gap-1 mb-1 mr-2 text-[10px] font-mono text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                      <Bot className="w-3 h-3" />
                      Intent: {msg.metadata.intent}
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-2xl ${
                    msg.role === 'CUSTOMER' 
                      ? 'bg-zinc-100 text-zinc-900 rounded-tl-sm border border-zinc-200' 
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                    {msg.createdAt ? format(new Date(msg.createdAt), "hh:mm a") : ""}
                    {msg.role === 'AI' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input Placeholder (Disabled since AI is managing) */}
            <div className="p-4 border-t border-zinc-200 bg-white/80 backdrop-blur-md">
              {activeChat.isAiManaging !== false ? (
                <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <Input 
                    disabled
                    placeholder="AI is currently managing this conversation. Click 'Takeover' to reply manually." 
                    className="bg-zinc-50 border-zinc-200"
                  />
                  <Button disabled className="bg-blue-600 text-white">Send</Button>
                </div>
              ) : (
                <form 
                  className="flex items-center gap-2"
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                >
                  <Input 
                    placeholder="Type your message..." 
                    value={manualMessage}
                    onChange={(e) => setManualMessage(e.target.value)}
                    className="bg-white border-zinc-200"
                    disabled={sending}
                  />
                  <Button 
                    type="submit" 
                    disabled={sending || !manualMessage.trim()} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Bot className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a conversation to view the chat history</p>
          </div>
        )}
      </div>
    </div>
  );
}
