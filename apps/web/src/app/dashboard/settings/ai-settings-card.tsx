"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Bot, ShieldAlert } from "lucide-react";

export function AiSettingsCard() {
  const [requireWhitelist, setRequireWhitelist] = useState(true);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial AI config
    fetch("http://localhost:4000/api/v1/settings/ai", {
      headers: {
        "Authorization": "Bearer TEST_TOKEN", // Mock auth for now
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setRequireWhitelist(data.requireWhitelist !== false);
          setNumbers(data.whitelistedNumbers || []);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch AI settings", err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/settings/ai", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer TEST_TOKEN", // Mock auth
        },
        body: JSON.stringify({
          requireWhitelist,
          whitelistedNumbers: numbers
        })
      });

      if (res.ok) {
        alert("AI Settings updated successfully!");
      } else {
        alert("Failed to update AI Settings.");
      }
    } catch (err) {
      alert("An error occurred while saving.");
    }
  };

  const addNumber = () => {
    if (!newNumber) return;
    // Format lightly for whatsapp-web
    let formatted = newNumber.replace(/\D/g, ''); // remove non-digits
    if (!formatted.endsWith('@c.us')) {
      formatted = formatted + '@c.us';
    }
    
    if (!numbers.includes(formatted)) {
      setNumbers([...numbers, formatted]);
    }
    setNewNumber("");
  };

  const removeNumber = (num: string) => {
    setNumbers(numbers.filter(n => n !== num));
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="h-40"></CardContent></Card>;
  }

  return (
    <Card className="border-purple-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Bot className="w-32 h-32 text-purple-600" />
      </div>

      <CardHeader>
        <CardTitle className="text-purple-700 flex items-center gap-2">
          <Bot className="w-5 h-5" />
          WhatsApp AI Brain
        </CardTitle>
        <CardDescription>Control who the AI Assistant is allowed to talk to.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold text-zinc-900">Testing Mode (Whitelist Only)</Label>
            <p className="text-sm text-zinc-500">
              When enabled, the AI will ONLY reply to the exact phone numbers listed below. 
              Turn this off in production when you want it to reply to all customers.
            </p>
          </div>
          <input 
            type="checkbox"
            checked={requireWhitelist} 
            onChange={(e) => setRequireWhitelist(e.target.checked)} 
            className="w-5 h-5 accent-purple-600 cursor-pointer"
          />
        </div>

        {requireWhitelist && (
          <div className="space-y-3">
            <Label>Whitelisted Phone Numbers</Label>
            <div className="flex flex-wrap gap-2 mb-3 bg-white p-3 border border-zinc-200 rounded-lg min-h-[60px]">
              {numbers.length === 0 ? (
                <span className="text-sm text-zinc-400 italic flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> No numbers added. The AI is effectively disabled.
                </span>
              ) : (
                numbers.map((num) => (
                  <Badge key={num} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1 py-1 px-2 text-sm">
                    {num.replace('@c.us', '')}
                    <button onClick={() => removeNumber(num)} className="hover:text-red-500 ml-1 bg-purple-200 rounded-full p-0.5 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            <div className="flex gap-2 max-w-sm">
              <Input 
                placeholder="e.g. 919876543210" 
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNumber()}
                className="flex-1"
              />
              <Button onClick={addNumber} variant="outline" className="shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Include country code. Do not use '+' or spaces.</p>
          </div>
        )}

        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
          Save AI Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
