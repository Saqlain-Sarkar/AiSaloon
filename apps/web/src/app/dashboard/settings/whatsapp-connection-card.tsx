"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCcw, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";


export function WhatsappConnectionCard() {
  const { user } = useAuth();
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling && !isConnected) {
      interval = setInterval(() => {
        fetchQr(true);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPolling, isConnected, user?.businessId]);

  const fetchQr = async (isBackground = false) => {
    if (!user?.businessId) return;
    if (!isBackground) setIsLoading(true);
    if (!isBackground) setMessage(null);
    setIsPolling(true);

    try {
      // The endpoint is public, but we pass Accept: application/json
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://aisaloon.onrender.com/api/v1"}/whatsapp/qr/${user.businessId}?t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (data.connected) {
        setIsConnected(true);
        setIsPolling(false);
        setQrImageUrl(null);
        setMessage("WhatsApp is successfully connected!");
      } else if (data.qrImageUrl) {
        setQrImageUrl(data.qrImageUrl);
        setIsConnected(false);
      } else {
        setMessage(data.message || "Initializing WhatsApp Client...");
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp status", err);
      if (!isBackground) setMessage("Error fetching WhatsApp status.");
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  return (
    <Card className="border-green-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <MessageSquare className="w-32 h-32 text-green-600" />
      </div>

      <CardHeader>
        <CardTitle className="text-green-700 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          WhatsApp AI Connection
        </CardTitle>
        <CardDescription>Connect your WhatsApp account to enable the AI assistant.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {isConnected ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold">Connected</p>
              <p className="text-sm">Your WhatsApp AI is currently active and ready to handle messages.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={() => fetchQr(false)} 
              disabled={isLoading || isPolling}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {isPolling ? "Waiting for Scan..." : "Generate WhatsApp QR"}
            </Button>
            
            {message && <p className="text-sm text-zinc-600 flex items-center gap-2">
              {isPolling && message === "Initializing WhatsApp Client..." && <Loader2 className="w-3 h-3 animate-spin" />}
              {message}
            </p>}
            
            {qrImageUrl && (
              <div className="mt-4 p-4 border border-zinc-200 rounded-lg bg-white inline-block text-center relative">
                <h3 className="font-semibold mb-2">Scan with WhatsApp</h3>
                <img src={qrImageUrl} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
                <p className="text-sm text-zinc-500 mt-2">Open WhatsApp {'>'} Linked Devices {'>'} Link a device</p>
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-zinc-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Auto-refreshing
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
