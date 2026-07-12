"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Scissors, Droplets, Sparkles, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchServices, createService, updateService, deleteService, fetchCategories } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string | number;
  category?: any;
}

const ICON_MAP: Record<string, any> = {
  "Hair": Scissors,
  "Treatment": Sparkles,
  "Grooming": Scissors,
  "Spa": Droplets,
  "default": Sparkles
};

const COLOR_MAP: Record<string, string> = {
  "Hair": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Skin": "bg-amber-500/20 text-amber-500 border-amber-500/30",
  "Nails": "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  "Grooming": "bg-indigo-500/20 text-indigo-500 border-indigo-500/30",
  "Spa": "bg-purple-500/20 text-purple-500 border-purple-500/30",
  "default": "bg-zinc-500/20 text-zinc-500 border-zinc-500/30"
};

export default function ServicesPage() {
  const { business } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    duration: 30,
    price: 0
  });

  useEffect(() => {
    async function load() {
      try {
        const [servicesData, categoriesData] = await Promise.all([
          fetchServices(),
          fetchCategories()
        ]);
        setServices(servicesData);
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setFormData(f => ({ ...f, categoryId: categoriesData[0].id }));
        }
      } catch (error) {
        console.error("Failed to load services:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateService = async () => {
    try {
      if (!formData.name) {
        alert("Please enter a service name.");
        return;
      }
      if (formData.price < 0 || formData.duration <= 0) {
        alert("Price and duration must be valid.");
        return;
      }

      if (editId) {
        await updateService(editId, {
          name: formData.name,
          categoryId: formData.categoryId,
          duration: Number(formData.duration),
          price: Number(formData.price),
        });
      } else {
        await createService({
          name: formData.name,
          categoryId: formData.categoryId,
          duration: Number(formData.duration),
          price: Number(formData.price),
          businessId: "business-1" // Fallback
        });
      }
      
      setIsOpen(false);
      setEditId(null);
      setFormData({ name: "", categoryId: categories[0]?.id || "", duration: 30, price: 0 });
      
      const data = await fetchServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to save service:", error);
      alert(`Error saving service: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleEditClick = (service: Service) => {
    setFormData({
      name: service.name,
      categoryId: service.category?.id || categories[0]?.id || "",
      duration: service.duration,
      price: Number(service.price)
    });
    setEditId(service.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      const data = await fetchServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to delete service:", error);
      alert("Error deleting service");
    }
  };

  const openNewService = () => {
    setEditId(null);
    setFormData({ name: "", categoryId: categories[0]?.id || "", duration: 30, price: 0 });
    setIsOpen(true);
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Services Catalog</h1>
          <p className="text-zinc-500">Manage your salon treatments and pricing.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={openNewService} className="bg-zinc-900 hover:bg-zinc-800 text-white shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
          <DialogContent className="bg-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Service Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Haircut" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({...formData, categoryId: v || ""})}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select category">
                      {categories.find(c => c.id === formData.categoryId)?.name || "Select category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input 
                    id="duration" 
                    type="number"
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price ({business?.currency || 'USD'})</Label>
                  <Input 
                    id="price" 
                    type="number"
                    step="0.01"
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={handleCreateService}>
                {editId ? "Save Changes" : "Save Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm w-full max-w-sm">
        <Search className="w-5 h-5 text-zinc-400 ml-2" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus-visible:ring-0 text-zinc-900 placeholder:text-zinc-400 h-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="text-zinc-500 p-4">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-zinc-500 p-4">No services found.</div>
        ) : filteredServices.map((service, idx) => {
          const categoryName = service.category?.name || 'General';
          const ServiceIcon = ICON_MAP[service.category?.icon || categoryName] || ICON_MAP['default'];
          
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm transition-all group overflow-hidden relative">
                {/* Subtle background glow */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${(COLOR_MAP[categoryName] || COLOR_MAP['default']).split(' ')[0]} rounded-full blur-3xl opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity`} />
                
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl border ${COLOR_MAP[categoryName] || COLOR_MAP['default']}`}>
                      <ServiceIcon className="w-5 h-5" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(service)} className="p-1.5 text-zinc-400 hover:text-zinc-900 bg-zinc-100 rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-1.5 text-zinc-400 hover:text-red-600 bg-zinc-100 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-zinc-900 mb-1">{service.name}</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="border-zinc-200 text-zinc-600 bg-zinc-50">
                      {categoryName}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                    <span className="text-sm text-zinc-500">Price</span>
                    <span className="text-lg font-bold text-zinc-900">{formatCurrency(service.price, business?.currency)}</span>
                    <span className="text-sm text-zinc-500 ml-1">/ {service.duration}m</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
