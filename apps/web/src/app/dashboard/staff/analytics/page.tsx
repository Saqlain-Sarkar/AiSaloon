"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { fetchEmployeeAnalyticsSummary } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Trophy,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Scissors,
  BarChart2,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

type DateRange = "7d" | "30d" | "thisMonth" | "allTime";

function getDateRange(range: DateRange): { startDate?: string; endDate?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  switch (range) {
    case "7d":
      return { startDate: fmt(subDays(now, 7)), endDate: fmt(now) };
    case "30d":
      return { startDate: fmt(subDays(now, 30)), endDate: fmt(now) };
    case "thisMonth":
      return { startDate: fmt(startOfMonth(now)), endDate: fmt(endOfMonth(now)) };
    case "allTime":
      return {};
  }
}

function Avatar({ name, color }: { name: string; color?: string | null }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const bg = color || "#6366f1";
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-zinc-700",
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-5 bg-white rounded-xl border border-zinc-100 shadow-sm flex items-start gap-4">
      <div className={`p-2.5 rounded-lg bg-zinc-50 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StaffAnalyticsPage() {
  const { business } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("30d");
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(range);
      const res = await fetchEmployeeAnalyticsSummary(startDate, endDate);
      setData(Array.isArray(res) ? res : []);
      setSelected(null);
    } catch (err) {
      console.error("Failed to load employee analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  // Summary totals
  const totalRevenue = data.reduce((s, e) => s + e.totalRevenue, 0);
  const totalAppointments = data.reduce((s, e) => s + e.totalAppointments, 0);
  const totalCustomers = data.reduce((s, e) => s + e.totalCustomers, 0);
  const leaderboard = [...data].slice(0, 3);

  const ranges: { label: string; value: DateRange }[] = [
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "This Month", value: "thisMonth" },
    { label: "All Time", value: "allTime" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Performance</h2>
          <p className="text-zinc-500 text-sm mt-1">Analytics and leaderboard for all active staff members.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "outline"}
              className={range === r.value ? "bg-zinc-900 text-white" : ""}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Staff" value={String(data.length)} color="text-blue-600" />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(totalRevenue, business?.currency)}
          color="text-green-600"
        />
        <StatCard icon={Calendar} label="Appointments" value={String(totalAppointments)} color="text-purple-600" />
        <StatCard icon={Users} label="Customers Served" value={String(totalCustomers)} color="text-orange-500" />
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.map((emp, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <Card
                  key={emp.employee.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selected?.employee?.id === emp.employee.id ? "ring-2 ring-zinc-900" : ""}`}
                  onClick={() => setSelected(selected?.employee?.id === emp.employee.id ? null : emp)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <Avatar name={emp.employee.name} color={emp.employee.color} />
                        <span className="absolute -top-1 -right-1 text-base leading-none">{medals[i]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{emp.employee.name}</p>
                        <p className="text-xs text-zinc-400">{emp.employee.title || "Stylist"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-zinc-400 text-xs">Revenue</p>
                        <p className="font-bold text-green-600">{formatCurrency(emp.totalRevenue, business?.currency)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-xs">Appointments</p>
                        <p className="font-bold">{emp.totalAppointments}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-xs">Avg Value</p>
                        <p className="font-semibold">{formatCurrency(emp.avgBookingValue, business?.currency)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-xs">Customers</p>
                        <p className="font-semibold">{emp.totalCustomers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Employee Detail */}
      {selected && (
        <Card className="border-zinc-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar name={selected.employee.name} color={selected.employee.color} />
              <div>
                <CardTitle>{selected.employee.name}</CardTitle>
                <CardDescription>{selected.employee.title || "Stylist"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-50 rounded-lg">
              <p className="text-xs text-zinc-400">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(selected.totalRevenue, business?.currency)}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-lg">
              <p className="text-xs text-zinc-400">Completed</p>
              <p className="text-xl font-bold">{selected.completedAppointments}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-lg">
              <p className="text-xs text-zinc-400">Avg Booking Value</p>
              <p className="text-xl font-bold">{formatCurrency(selected.avgBookingValue, business?.currency)}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-lg">
              <p className="text-xs text-zinc-400">Unique Customers</p>
              <p className="text-xl font-bold">{selected.totalCustomers}</p>
            </div>

            {/* Status Breakdown */}
            <div className="col-span-2 md:col-span-2">
              <p className="text-xs text-zinc-400 mb-2 font-semibold uppercase">Appointment Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selected.statusBreakdown).map(([status, count]: any) => (
                  <div
                    key={status}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                      ${status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                        status === "CANCELLED" || status === "NO_SHOW" ? "bg-red-50 text-red-600 border-red-200" :
                        "bg-zinc-50 text-zinc-600 border-zinc-200"}`}
                  >
                    {status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> :
                     status === "CANCELLED" || status === "NO_SHOW" ? <XCircle className="w-3 h-3" /> :
                     <Clock className="w-3 h-3" />}
                    {status}: {count}
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Services */}
            {selected.popularServices?.length > 0 && (
              <div className="col-span-2 md:col-span-2">
                <p className="text-xs text-zinc-400 mb-2 font-semibold uppercase">Popular Services</p>
                <div className="flex flex-col gap-1">
                  {selected.popularServices.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3 h-3 text-zinc-400" />
                        <span>{s.name}</span>
                      </div>
                      <Badge variant="secondary">{s.count} times</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-zinc-500" />
            All Staff Performance
          </CardTitle>
          <CardDescription>Click any row to view detailed stats above.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 animate-pulse">Loading performance data...</div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-zinc-400">
              No data found. Assign staff to appointments to start tracking performance.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Total Appointments</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Avg Value</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((emp, i) => (
                  <TableRow
                    key={emp.employee.id}
                    className={`cursor-pointer hover:bg-zinc-50 ${selected?.employee?.id === emp.employee.id ? "bg-zinc-50" : ""}`}
                    onClick={() => setSelected(selected?.employee?.id === emp.employee.id ? null : emp)}
                  >
                    <TableCell>
                      <span className="font-bold text-zinc-400">#{i + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.employee.name} color={emp.employee.color} />
                        <div>
                          <p className="font-medium">{emp.employee.name}</p>
                          <p className="text-xs text-zinc-400">{emp.employee.title || "Stylist"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{emp.totalAppointments}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {emp.completedAppointments}
                      </Badge>
                    </TableCell>
                    <TableCell>{emp.totalCustomers}</TableCell>
                    <TableCell>{formatCurrency(emp.avgBookingValue, business?.currency)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(emp.totalRevenue, business?.currency)}
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
