"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail, User, Phone, Filter } from "lucide-react";
import { fetchCustomers, createCustomer } from "@/lib/api";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", phone: "", email: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [visitFilter, setVisitFilter] = useState<string>("ALL");

  async function load() {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      
      // Deduplicate customers by phone number
      const uniqueCustomersMap = new Map();
      (data.customers || []).forEach((c: any) => {
        if (!uniqueCustomersMap.has(c.phone)) {
          uniqueCustomersMap.set(c.phone, c);
        }
      });
      const uniqueCustomers = Array.from(uniqueCustomersMap.values());
      
      setClients(uniqueCustomers);
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleCreateClient = async () => {
    try {
      if (!newClientData.name || !newClientData.phone) {
        alert("Name and phone number are required.");
        return;
      }
      
      await createCustomer({
        name: newClientData.name,
        phone: newClientData.phone,
        email: newClientData.email
      });
      
      setIsAddOpen(false);
      setNewClientData({ name: "", phone: "", email: "" });
      load(); // Refresh list
    } catch (error) {
      console.error("Failed to create client:", error);
      alert("Error creating client");
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Phone", "Email", "Total Visits", "Total Spent", "Last Visit"];
    const rows = filteredClients.map(client => [
      client.name || "Unknown",
      client.phone || "",
      client.email || "",
      client.totalVisits.toString(),
      client.totalSpent?.toString() || "0",
      client.lastVisitAt ? format(new Date(client.lastVisitAt), 'yyyy-MM-dd') : 'Never'
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(x => `"${x}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (client.phone || "").includes(searchTerm) ||
                          (client.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesVisit = true;
    if (visitFilter === "VIP") matchesVisit = client.totalVisits > 10;
    else if (visitFilter === "REGULAR") matchesVisit = client.totalVisits > 5 && client.totalVisits <= 10;
    else if (visitFilter === "NEW") matchesVisit = client.totalVisits <= 5;

    return matchesSearch && matchesVisit;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-zinc-500">Manage your customer relationships and history.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Add Client</Button>} />
          <DialogContent className="bg-white sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
            <div className="px-6 py-4 border-b bg-zinc-50/50">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-zinc-500" />
                Add New Client
              </DialogTitle>
              <p className="text-sm text-zinc-500 mt-1">
                Enter the client's contact details below.
              </p>
            </div>
            
            <div className="px-6 py-6 grid gap-4 bg-white">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input 
                    className="pl-9 bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-400"
                    placeholder="e.g. Jane Doe" 
                    value={newClientData.name} 
                    onChange={(e) => setNewClientData({...newClientData, name: e.target.value})} 
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
                    value={newClientData.phone} 
                    onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input 
                    className="pl-9 bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-400"
                    placeholder="e.g. jane@example.com" 
                    type="email"
                    value={newClientData.email} 
                    onChange={(e) => setNewClientData({...newClientData, email: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-zinc-50/50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddOpen(false)} className="bg-white">
                Cancel
              </Button>
              <Button onClick={handleCreateClient} className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm px-6">
                Save Client
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
              placeholder="Search clients by name, phone or email..." 
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
                <DropdownMenuItem onClick={() => setVisitFilter("ALL")}>All Clients</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVisitFilter("VIP")}>VIP ({'>'} 10 visits)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVisitFilter("REGULAR")}>Regular (6-10 visits)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVisitFilter("NEW")}>New (≤ 5 visits)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleExport}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Details</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Total Visits</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    No clients found matching your filters.
                  </TableCell>
                </TableRow>
              ) : filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name || 'Unknown'}</div>
                    <Badge variant="secondary" className="mt-1 font-normal text-[10px]">
                      {client.totalVisits > 10 ? "VIP" : client.totalVisits > 5 ? "Regular" : "New"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.phone || 'No phone'}</div>
                    <div className="text-xs text-zinc-500 flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" /> {client.email || 'No email'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{client.totalVisits}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.lastVisitAt ? format(new Date(client.lastVisitAt), 'MMM dd, yyyy') : 'Never'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">${Number(client.totalSpent || 0).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View Profile</Button>
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
