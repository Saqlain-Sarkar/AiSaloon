"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { ArrowLeft, Mail, Phone, Calendar, Clock, DollarSign, User, Activity } from "lucide-react";

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { business } = useAuth();
  
  const [customer, setCustomer] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!params.id) return;
      try {
        setLoading(true);
        // Fetch core customer info
        const customerData = await fetchApi(`/customers/${params.id}`);
        setCustomer(customerData);

        // Fetch insights (Total visits, spent, etc)
        const insightsData = await fetchApi(`/customers/${params.id}/insights`);
        setInsights(insightsData);

        // Fetch appointment history
        const apptData = await fetchApi(`/customers/${params.id}/appointments`);
        setAppointments(apptData);

      } catch (err) {
        console.error("Failed to load customer profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading profile...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">Customer not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-zinc-500 text-sm">Customer Profile</p>
        </div>
        {customer.isVip && <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600">VIP</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-zinc-500" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-zinc-400" />
              <span className="text-sm">{customer.phone || "No phone number"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span className="text-sm">{customer.email || "No email address"}</span>
            </div>
            <div className="pt-4 border-t border-zinc-100">
              <div className="text-xs text-zinc-500 mb-1">Customer Since</div>
              <div className="text-sm">{format(new Date(customer.createdAt), "MMMM dd, yyyy")}</div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Card */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-zinc-500" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="text-xs text-zinc-500 mb-1">Total Visits</div>
                <div className="text-2xl font-semibold">{insights?.totalVisits || 0}</div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="text-xs text-zinc-500 mb-1">Total Spent</div>
                <div className="text-2xl font-semibold text-green-600">
                  {formatCurrency(insights?.totalSpent || 0, business?.currency)}
                </div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="text-xs text-zinc-500 mb-1">Avg Spend</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(insights?.averageSpend || 0, business?.currency)}
                </div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="text-xs text-zinc-500 mb-1">Last Visit</div>
                <div className="text-sm font-medium mt-1">
                  {insights?.lastVisit ? format(new Date(insights.lastVisit), "MMM dd, yyyy") : "Never"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-zinc-500" />
            Appointment History
          </CardTitle>
          <CardDescription>All past and upcoming appointments for {customer.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">No appointments found for this customer.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt: any) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      <div className="font-medium">{format(new Date(appt.startTime), "MMM dd, yyyy")}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(appt.startTime), "h:mm a")} ({appt.duration} min)
                      </div>
                    </TableCell>
                    <TableCell>{appt.service?.name || "Custom Service"}</TableCell>
                    <TableCell>{appt.employee?.name || "Any Staff"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        appt.status === 'COMPLETED' ? 'default' :
                        appt.status === 'PENDING' ? 'secondary' :
                        appt.status === 'CONFIRMED' ? 'outline' : 'destructive'
                      }>
                        {appt.status}
                      </Badge>
                      {appt.paymentStatus === 'PAID' && (
                        <Badge className="ml-2 bg-green-500 hover:bg-green-600">Paid</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(appt.price, business?.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
