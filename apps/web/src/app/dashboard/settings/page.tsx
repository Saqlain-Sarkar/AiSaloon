"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiSettingsCard } from "./ai-settings-card";
import { WhatsappConnectionCard } from "./whatsapp-connection-card";
import { WorkingHoursCard } from "./working-hours-card";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, business, setBusiness } = useAuth();
  
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("USD");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setSalonName(business.name || "");
      setPhone(business.phone || "");
      setCurrency(business.currency || "USD");
    }
  }, [business]);

  const handleSaveProfile = async () => {
    if (!user?.businessId) return;
    
    setIsSaving(true);
    try {
      const updatedBusiness = await fetchApi(`/business/${user.businessId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: salonName,
          phone: phone,
          currency: currency
        })
      });
      setBusiness(updatedBusiness);
      alert("Profile updated successfully!");
    } catch (error: any) {
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-zinc-500">Manage your salon profile and booking preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Salon Profile</CardTitle>
            <CardDescription>Update your public-facing salon details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="salon-name">Salon Name</Label>
              <Input 
                id="salon-name" 
                value={salonName} 
                onChange={(e) => setSalonName(e.target.value)} 
                placeholder="Enter salon name" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+1 (555) 123-4567" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Global Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v || "USD")}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AED">AED (د.إ)</SelectItem>
                  <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* AI Brain Settings (WhatsApp Whitelist) */}
        <AiSettingsCard />
        
        {/* WhatsApp Connection */}
        <WhatsappConnectionCard />

        {/* Working Hours */}
        <WorkingHoursCard />
      </div>
    </div>
  );
}
