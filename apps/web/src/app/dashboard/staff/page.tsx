"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, UserCircle, Briefcase, Phone, Mail, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/lib/api";

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
}

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("Failed to load staff:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.name) {
        alert("Please enter a staff name.");
        return;
      }

      if (editId) {
        await updateEmployee(editId, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          title: formData.title,
        });
      } else {
        await createEmployee({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          title: formData.title,
          businessId: "business-1" // Fallback
        });
      }
      
      setIsOpen(false);
      setEditId(null);
      setFormData({ name: "", email: "", phone: "", title: "" });
      
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to save staff:", error);
      alert(`Error saving staff: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleEditClick = (employee: Employee) => {
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      title: employee.title || "",
    });
    setEditId(employee.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await deleteEmployee(id);
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to delete staff:", error);
      alert("Error deleting staff");
    }
  };

  const openNew = () => {
    setEditId(null);
    setFormData({ name: "", email: "", phone: "", title: "" });
    setIsOpen(true);
  };

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Staff Management</h1>
          <p className="text-zinc-500">Manage your salon employees and team members.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={openNew} className="bg-zinc-900 hover:bg-zinc-800 text-white shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
          <DialogContent className="bg-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Staff" : "Add New Staff"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Jane Doe" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Senior Stylist" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="e.g. jane@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="e.g. +1 555-0123"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={handleSave}>
                {editId ? "Save Changes" : "Save Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm w-full max-w-sm">
        <Search className="w-5 h-5 text-zinc-400 ml-2" />
        <Input
          placeholder="Search staff by name or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus-visible:ring-0 text-zinc-900 placeholder:text-zinc-400 h-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="text-zinc-500 p-4">Loading staff...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-zinc-500 p-4">No staff members found.</div>
        ) : filteredEmployees.map((employee, idx) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity" />
              
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl border bg-blue-50/50 text-blue-500 border-blue-100">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(employee)} className="p-1.5 text-zinc-400 hover:text-zinc-900 bg-zinc-100 rounded-md transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(employee.id)} className="p-1.5 text-zinc-400 hover:text-red-600 bg-zinc-100 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-zinc-900 mb-1 line-clamp-1">{employee.name}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="border-zinc-200 text-zinc-600 bg-zinc-50">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {employee.title || "Staff"}
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-zinc-100">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 line-clamp-1">
                      <Mail className="w-4 h-4 shrink-0 text-zinc-400" />
                      {employee.email}
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 line-clamp-1">
                      <Phone className="w-4 h-4 shrink-0 text-zinc-400" />
                      {employee.phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
