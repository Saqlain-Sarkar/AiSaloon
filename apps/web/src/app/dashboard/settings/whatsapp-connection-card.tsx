"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCcw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";


export function WhatsappConnectionCard() {
  const { user } = useAuth();
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQr = async () => {
    if (!user?.businessId) return;
    setIsLoading(true);
    setMessage(null);

    try {
      // The endpoint is public, but we pass Accept: application/json
      const response = await fetch(`http://localhost:4000/api/v1/whatsapp/qr/${user.businessId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.connected) {
        setIsConnected(true);
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
      setMessage("Error fetching WhatsApp status.");
    } finally {
      setIsLoading(false);
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
              onClick={fetchQr} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {qrImageUrl ? "Refresh QR Code" : "Generate WhatsApp QR"}
            </Button>
            
            {message && <p className="text-sm text-zinc-600">{message}</p>}
            
            {qrImageUrl && (
              <div className="mt-4 p-4 border border-zinc-200 rounded-lg bg-white inline-block text-center">
                <h3 className="font-semibold mb-2">Scan with WhatsApp</h3>
                <img src={qrImageUrl} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
                <p className="text-sm text-zinc-500 mt-2">Open WhatsApp {'>'} Linked Devices {'>'} Link a device</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
