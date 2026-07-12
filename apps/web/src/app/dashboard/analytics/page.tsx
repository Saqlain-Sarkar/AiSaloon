"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, CalendarCheck, DollarSign } from "lucide-react";
import { fetchAnalyticsRevenue, fetchAnalyticsPopularServices, fetchServices } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];

const aiStatsDummy = [
  { name: "Conversations", value: 124 },
  { name: "Bookings", value: 45 },
  { name: "Queries Resolved", value: 68 },
  { name: "Escalated", value: 11 },
];

export default function AnalyticsPage() {
  const { business } = useAuth();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, appointments: 0, newCustomers: 32, conversion: 36.2 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);
        
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7); // Include future appointments for testing
        
        const startDate = startOfWeek.toISOString();
        const endDate = endOfWeek.toISOString();

        const [revRes, popRes, allServices] = await Promise.all([
          fetchAnalyticsRevenue(startDate, endDate),
          fetchAnalyticsPopularServices(startDate, endDate),
          fetchServices(),
        ]);

        // Process Revenue Data
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const revChartData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          revChartData.push({
            name: days[d.getDay()],
            total: revRes.dailyBreakdown[dateStr] || 0
          });
        }
        setRevenueData(revChartData);

        // Process Summary
        setSummary(prev => ({
          ...prev,
          totalRevenue: revRes.total || 0,
          appointments: revRes.count || 0
        }));

        // Process Services
        const serviceMap = new Map(allServices.map((s: any) => [s.id, s.name]));
        const popChartData = popRes.map((p: any) => ({
          name: serviceMap.get(p.serviceId) || "Unknown",
          value: p._count.serviceId
        }));
        setServiceData(popChartData.length > 0 ? popChartData : [{ name: "No Bookings", value: 1 }]);

      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading live analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Business Intelligence</h1>
        <p className="text-zinc-500">AI-powered insights into your salon's performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Revenue (7d)", value: formatCurrency(summary.totalRevenue, business?.currency), icon: DollarSign, trend: "Live", color: "text-blue-500" },
          { title: "AI Appointments", value: summary.appointments.toString(), icon: CalendarCheck, trend: "+12%", color: "text-emerald-500" },
          { title: "New Customers", value: summary.newCustomers.toString(), icon: Users, trend: "Static", color: "text-purple-500" },
          { title: "AI Conversion Rate", value: `${summary.conversion}%`, icon: TrendingUp, trend: "Static", color: "text-pink-500" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
                <p className="text-xs text-emerald-600 mt-1">
                  {stat.trend} data
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900">Revenue Overview</CardTitle>
            <CardDescription className="text-zinc-500">Daily revenue for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value, business?.currency)} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatCurrency(value, business?.currency), "Revenue"]}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900">Popular Services</CardTitle>
            <CardDescription className="text-zinc-500">Breakdown of bookings by category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', color: '#18181b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-2 flex flex-wrap justify-center gap-4 w-full px-4">
               {serviceData.map((entry, index) => (
                 <div key={entry.name} className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-xs text-zinc-600 line-clamp-1">{entry.name}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900">AI Assistant Performance</CardTitle>
            <CardDescription className="text-zinc-500">Metrics on how well your AI Receptionist is performing.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiStatsDummy} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f4f4f5'}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', color: '#18181b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
