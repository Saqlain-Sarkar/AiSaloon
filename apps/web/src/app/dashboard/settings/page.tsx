import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiSettingsCard } from "./ai-settings-card";
import { WhatsappConnectionCard } from "./whatsapp-connection-card";

export default function SettingsPage() {
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
              <Input id="salon-name" defaultValue="SalonFlow Demo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Settings</CardTitle>
            <CardDescription>Configure how clients can book appointments with you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="lead-time">Minimum Lead Time (Hours)</Label>
              <Input id="lead-time" type="number" defaultValue="2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cancel-policy">Cancellation Policy (Hours before)</Label>
              <Input id="cancel-policy" type="number" defaultValue="24" />
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>

        {/* AI Brain Settings (WhatsApp Whitelist) */}
        <AiSettingsCard />
        
        {/* WhatsApp Connection */}
        <WhatsappConnectionCard />
      </div>
    </div>
  );
}
