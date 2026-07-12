"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreHorizontal, CheckCircle2, XCircle, Clock, User, Scissors, Calendar as CalendarIcon, UserPlus, Phone, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuGroup, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { fetchAppointments, fetchCustomers, fetchServices, createAppointment, createCustomer, updateAppointmentStatus } from "@/lib/api";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function AppointmentsPage() {
  const { business } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "" });
  const [formData, setFormData] = useState({
    customerId: "",
    serviceId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [completeAptId, setCompleteAptId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  async function loadData() {
    try {
      setLoading(true);
      const [apts, custs, servs] = await Promise.all([
        fetchAppointments(),
        fetchCustomers(),
        fetchServices()
      ]);
      
      // Deduplicate customers by ID
      const uniqueCustomersMap = new Map();
      (custs.customers || []).forEach((c: any) => {
        if (!uniqueCustomersMap.has(c.id)) {
          uniqueCustomersMap.set(c.id, c);
        }
      });
      const uniqueCustomers = Array.from(uniqueCustomersMap.values());
      
      setAppointments(apts);
      setCustomers(uniqueCustomers);
      setServices(servs);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, pStatus?: string, pMethod?: string) => {
    try {
      await updateAppointmentStatus(id, { status: newStatus, paymentStatus: pStatus, paymentMethod: pMethod });
      setAppointments((prev) => 
        prev.map((apt) => (apt.id === id ? { 
          ...apt, 
          status: newStatus, 
          ...(pStatus && { paymentStatus: pStatus }),
          ...(pMethod && { paymentMethod: pMethod })
        } : apt))
      );
      if (newStatus === "COMPLETED") {
        setCompleteAptId(null);
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      alert("Failed to update status: " + (error.message || "Unknown error"));
    }
  };

  const handleCreateAppointment = async () => {
    try {
      let targetCustomerId = formData.customerId;
      
      if (isNewCustomer) {
        if (!newCustomerData.name || !newCustomerData.phone) {
          alert("Please provide both name and phone for the new customer.");
          return;
        }
        const newCust = await createCustomer({
          name: newCustomerData.name,
          phone: newCustomerData.phone
        });
        targetCustomerId = newCust.id;
      }

      if (!targetCustomerId) {
        alert("Please select or create a customer.");
        return;
      }
      
      if (!formData.serviceId) {
        alert("Please select a service.");
        return;
      }

      const selectedService = services.find(s => s.id === formData.serviceId);
      const duration = selectedService ? selectedService.duration : 30;
      
      await createAppointment({
        branchId: "branch-main",
        customerId: targetCustomerId,
        serviceId: formData.serviceId,
        startTime: new Date(`${formData.date}T${formData.time}:00`).toISOString(),
        duration,
        source: "STAFF"
      });
      
      setIsOpen(false);
      setNewCustomerData({ name: "", phone: "" });
      setIsNewCustomer(false);
      loadData(); // Refresh list
    } catch (error: any) {
      console.error("Failed to create appointment:", error);
      alert(`Error creating appointment: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    const headers = ["Customer", "Phone", "Service", "Staff", "Date", "Time", "Status"];
    const rows = filteredAppointments.map(apt => [
      apt.customer?.name || "Unknown",
      apt.customer?.phone || "",
      apt.service?.name || "Unknown Service",
      apt.employee?.name || "Any Staff",
      format(new Date(apt.startTime), 'yyyy-MM-dd'),
      format(new Date(apt.startTime), 'HH:mm'),
      apt.status,
      apt.paymentStatus || "UNPAID",
      apt.paymentMethod || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(x => `"${x}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = (apt.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (apt.customer?.phone || "").includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
          <p className="text-zinc-500">Manage your salon's bookings and schedule.</p>
        </div>
        
        {/* Payment / Completion Dialog */}
        <Dialog open={!!completeAptId} onOpenChange={(open) => !open && setCompleteAptId(null)}>
          <DialogContent className="bg-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Complete Appointment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-zinc-500">How did the customer pay for this appointment?</p>
              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val) => { if (val !== null) setPaymentMethod(val); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="CASH">💵 Cash</SelectItem>
                    <SelectItem value="UPI">📱 UPI</SelectItem>
                    <SelectItem value="CARD">💳 Card</SelectItem>
                    <SelectItem value="ONLINE">🌐 Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteAptId(null)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (completeAptId) handleUpdateStatus(completeAptId, "COMPLETED", "PAID", paymentMethod);
                }} 
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Mark Paid & Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
            <div className="px-6 py-4 border-b bg-zinc-50/50">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-zinc-500" />
                Create New Booking
              </DialogTitle>
              <p className="text-sm text-zinc-500 mt-1">
                Enter the details below to schedule an appointment.
              </p>
            </div>
            
            <div className="px-6 py-6 grid gap-6">
              {/* Customer Section */}
              <div className="space-y-4">
                <div className="flex p-1 bg-zinc-100/80 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setIsNewCustomer(false)}
                    className={`flex-1 flex justify-center items-center gap-2 text-sm font-medium py-2 rounded-lg transition-all ${!isNewCustomer ? 'bg-white shadow-sm text-zinc-900 ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    <User className="w-4 h-4" />
                    Existing Customer
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsNewCustomer(true)}
                    className={`flex-1 flex justify-center items-center gap-2 text-sm font-medium py-2 rounded-lg transition-all ${isNewCustomer ? 'bg-white shadow-sm text-zinc-900 ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    <UserPlus className="w-4 h-4" />
                    New Customer
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-sm space-y-4">
                  {isNewCustomer ? (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                          <Input 
                            className="pl-9 bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-400"
                            placeholder="e.g. Jane Doe" 
                            value={newCustomerData.name} 
                            onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})} 
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                          <Input 
                            className="pl-9 bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-400"
                            placeholder="e.g. +1 234 567 8900" 
                            value={newCustomerData.phone} 
                            onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})} 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select Customer</Label>
                      <Select value={formData.customerId} onValueChange={(v) => setFormData({...formData, customerId: v || ""})}>
                        <SelectTrigger className="w-full bg-zinc-50/50 border-zinc-200">
                          {formData.customerId ? (
                            <span className="flex-1 text-left line-clamp-1">{customers.find(c => c.id === formData.customerId)?.name}</span>
                          ) : (
                            <span className="flex-1 text-left text-zinc-500">Search or select a customer...</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-60 w-[--radix-select-trigger-width]">
                          {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} <span className="text-zinc-400 ml-1 text-xs">({c.phone})</span></SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Service & Time Section */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Service</Label>
                  <Select value={formData.serviceId} onValueChange={(v) => setFormData({...formData, serviceId: v || ""})}>
                    <SelectTrigger className="w-full bg-zinc-50/50 border-zinc-200">
                      <div className="flex flex-1 items-center gap-2 text-left line-clamp-1">
                        <Scissors className="w-4 h-4 text-zinc-500 shrink-0" />
                        {formData.serviceId ? (
                          <span className="capitalize">{services.find(s => s.id === formData.serviceId)?.name}</span>
                        ) : (
                          <span className="text-zinc-500">Choose a service</span>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-60 w-[--radix-select-trigger-width]">
                      {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} <span className="text-zinc-400 ml-1 text-xs">({formatCurrency(s.price, business?.currency)})</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <Input 
                        type="date" 
                        className="pl-9 bg-zinc-50/50 border-zinc-200"
                        value={formData.date} 
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <Input 
                        type="time" 
                        className="pl-9 bg-zinc-50/50 border-zinc-200"
                        value={formData.time} 
                        onChange={(e) => setFormData({...formData, time: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-zinc-50/50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-white">
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm px-6">
                Confirm Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search appointments..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full sm:w-auto" />}>
                <Filter className="mr-2 h-4 w-4" /> Filter
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>All Appointments</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("CONFIRMED")}>Confirmed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("COMPLETED")}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("CANCELLED")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleExport}>Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    Loading appointments...
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    No appointments found matching your filters.
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <div className="font-medium">{apt.customer?.name || 'Unknown'}</div>
                    <div className="text-xs text-zinc-500">{apt.customer?.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell>{apt.service?.name || 'Unknown Service'}</TableCell>
                  <TableCell>{apt.employee?.name || 'Any Staff'}</TableCell>
                  <TableCell>
                    <div>{format(new Date(apt.startTime), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-zinc-500">{format(new Date(apt.startTime), 'hh:mm a')}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        apt.status === "CONFIRMED" ? "default" : 
                        apt.status === "CANCELLED" ? "destructive" : 
                        apt.status === "COMPLETED" ? "outline" : "secondary"
                      }
                      className={
                        "capitalize " + (
                          apt.status === "CONFIRMED" ? "bg-green-500 hover:bg-green-600" : 
                          apt.status === "COMPLETED" ? "border-green-500 text-green-600" : ""
                        )
                      }
                    >
                      {apt.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {apt.paymentStatus === "PAID" ? (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        PAID {apt.paymentMethod ? `(${apt.paymentMethod})` : ''}
                      </Badge>
                    ) : apt.paymentStatus === "PARTIAL" ? (
                      <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                        PARTIAL
                      </Badge>
                    ) : apt.paymentStatus === "REFUNDED" ? (
                      <Badge variant="outline" className="bg-zinc-100 border-zinc-200 text-zinc-600">
                        REFUNDED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 border-red-200 text-red-600">
                        UNPAID
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {apt.status === "PENDING" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => handleUpdateStatus(apt.id, "CONFIRMED")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleUpdateStatus(apt.id, "CANCELLED")}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {apt.status === "CONFIRMED" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            onClick={() => setCompleteAptId(apt.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateStatus(apt.id, "CANCELLED")}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {(apt.status === "COMPLETED" || apt.status === "CANCELLED") && (
                        <Button variant="ghost" size="sm" className="text-zinc-400 cursor-default hover:bg-transparent">
                          No actions
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
