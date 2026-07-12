"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function WorkingHoursCard() {
  const { user } = useAuth();
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchHours = async () => {
      if (!user?.businessId) return;
      setIsLoading(true);
      try {
        const branches = await fetchApi(`/branches`);
        if (branches && branches.length > 0) {
          const mainBranch = branches[0];
          setBranchId(mainBranch.id);
          
          if (mainBranch.workingHours && mainBranch.workingHours.length > 0) {
             setWorkingHours(mainBranch.workingHours);
          } else {
             // Fallback default
             const defaultHours = DAYS_OF_WEEK.map(day => ({
                dayOfWeek: day,
                openTime: '09:00',
                closeTime: '17:00',
                isClosed: day === 'SATURDAY' || day === 'SUNDAY'
             }));
             setWorkingHours(defaultHours);
          }
        }
      } catch (err) {
        console.error("Failed to load working hours:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHours();
  }, [user]);

  const handleToggleClosed = (index: number, isClosed: boolean) => {
    const newHours = [...workingHours];
    newHours[index] = { ...newHours[index], isClosed };
    setWorkingHours(newHours);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    const newHours = [...workingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setWorkingHours(newHours);
  };

  const handleSave = async () => {
    if (!branchId) return;
    setIsSaving(true);
    try {
      await fetchApi(`/branches/${branchId}/working-hours`, {
        method: 'POST',
        body: JSON.stringify(workingHours)
      });
      alert("Working hours saved successfully!");
    } catch (err: any) {
      alert("Failed to save working hours: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Hours</CardTitle>
        <CardDescription>Set the opening and closing times for your salon. Your AI assistant will only book appointments during these hours.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading hours...
          </div>
        ) : (
          <div className="space-y-4">
            {workingHours.map((wh, index) => (
              <div key={wh.dayOfWeek} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 w-[150px]">
                  <Switch 
                    checked={!wh.isClosed} 
                    onCheckedChange={(checked) => handleToggleClosed(index, !checked)} 
                  />
                  <Label className={`font-medium ${wh.isClosed ? 'text-zinc-400' : ''}`}>
                    {wh.dayOfWeek.charAt(0) + wh.dayOfWeek.slice(1).toLowerCase()}
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    disabled={wh.isClosed} 
                    value={wh.openTime} 
                    onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)} 
                    className="w-[120px]" 
                  />
                  <span className="text-zinc-500 text-sm">to</span>
                  <Input 
                    type="time" 
                    disabled={wh.isClosed} 
                    value={wh.closeTime} 
                    onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)} 
                    className="w-[120px]" 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Business Hours"}
        </Button>
      </CardFooter>
    </Card>
  );
}
