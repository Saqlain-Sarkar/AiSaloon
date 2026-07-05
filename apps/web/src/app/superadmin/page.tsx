"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CalendarDays, Activity } from "lucide-react";
import { fetchApi } from "@/lib/apiClient";

export default function SuperadminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchApi('/superadmin/stats');
        setStats(response);
      } catch (err) {
        console.error("Failed to fetch superadmin stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-zinc-400">Loading platform metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h2>
        <p className="text-zinc-400">Global metrics across all SaaS tenants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Tenants</CardTitle>
            <Building2 className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBusinesses || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Active salons on the platform</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
            <Users className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Platform-wide registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Appointments</CardTitle>
            <CalendarDays className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalAppointments || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Processed by all tenants</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">System Health</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">Online</div>
            <p className="text-xs text-zinc-500 mt-1">All services operational</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
