"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, Clock, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAppointments } from "@/lib/api";
import { isSameDay, isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/components/AuthProvider";

type DateRangeType = "Today" | "Yesterday" | "Last 7 Days" | "This Month" | "Last Month" | "Custom Range" | "All Time";

export default function DashboardPage() {
  const { business } = useAuth();
  const [dateRange, setDateRange] = useState<DateRangeType>("All Time");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
       try {
          const data = await fetchAppointments();
          setAppointments(data);
       } catch (e) {
          console.error(e);
       } finally {
          setLoading(false);
       }
    }
    load();
  }, []);

  // Filter logic
  const filteredAppointments = useMemo(() => {
    const today = new Date();
    
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      
      switch (dateRange) {
        case "Today":
          return isSameDay(aptDate, today);
        case "Yesterday":
          return isSameDay(aptDate, subDays(today, 1));
        case "Last 7 Days":
          return isWithinInterval(aptDate, { start: subDays(startOfDay(today), 7), end: endOfDay(today) });
        case "This Month":
          return isWithinInterval(aptDate, { start: startOfMonth(today), end: endOfMonth(today) });
        case "Last Month":
          const lastMonth = subMonths(today, 1);
          return isWithinInterval(aptDate, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
        case "Custom Range":
          if (customRange?.from) {
             const start = startOfDay(customRange.from);
             // If 'to' is not selected, just filter for the single 'from' day
             if (!customRange.to) {
                return isSameDay(aptDate, start);
             }
             const end = endOfDay(customRange.to);
             return isWithinInterval(aptDate, { start, end });
          }
          return true;
        case "All Time":
        default:
          return true;
      }
    });
  }, [appointments, dateRange, customRange]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalBookings = filteredAppointments.length;
    const pendingRequests = filteredAppointments.filter(a => a.status === "pending").length;
    const returningClients = 0; // Requires calculating unique customers
    const returningPercentage = totalBookings > 0 ? Math.round((returningClients / totalBookings) * 100) : 0;
    
    // Revenue is sum of price for completed appointments
    const revenue = filteredAppointments
      .filter(a => a.status === "COMPLETED")
      .reduce((sum, apt) => sum + Number(apt.price || apt.service?.price || 0), 0);

    return { totalBookings, pendingRequests, returningPercentage, revenue };
  }, [filteredAppointments]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-zinc-500">Summary of your salon's performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {dateRange === "Custom Range" && (
            <Popover>
              <PopoverTrigger render={<Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal bg-white",
                    !customRange && "text-muted-foreground"
                  )}
                />}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {customRange?.from ? (
                    customRange.to ? (
                      <>
                        {format(customRange.from, "LLL dd, y")} -{" "}
                        {format(customRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="end">
                <CalendarComponent
                  mode="range"
                  defaultMonth={customRange?.from}
                  selected={customRange}
                  onSelect={setCustomRange as any}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-100 text-zinc-500">
              <Filter className="h-4 w-4" />
            </div>
            <Select value={dateRange} onValueChange={(val: DateRangeType | null) => setDateRange(val || "All Time")}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="Custom Range">Custom Range</SelectItem>
                <SelectItem value="All Time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalBookings}</div>
            <p className="text-xs text-zinc-500">Appointments in this period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingRequests}</div>
            <p className="text-xs text-zinc-500">Needs confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Returning Clients</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.returningPercentage}%</div>
            <p className="text-xs text-zinc-500">Of bookings in this period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.revenue, business?.currency)}</div>
            <p className="text-xs text-zinc-500">From confirmed/completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Filtered Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                      No appointments found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div className="font-medium">{apt.customer?.name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{apt.customer?.phone || 'No phone'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{apt.service?.name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{formatCurrency(apt.service?.price, business?.currency)}</div>
                      </TableCell>
                      <TableCell>
                        <div>{format(new Date(apt.startTime), "MMM dd, yyyy")}</div>
                        <div className="text-xs text-zinc-500">{format(new Date(apt.startTime), "hh:mm a")}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            apt.status === "CONFIRMED" ? "default" : 
                            apt.status === "CANCELLED" ? "destructive" : 
                            apt.status === "COMPLETED" ? "outline" : "secondary"
                          }
                          className={cn(
                            "capitalize",
                            apt.status === "CONFIRMED" ? "bg-green-500 hover:bg-green-600" : 
                            apt.status === "COMPLETED" ? "border-green-500 text-green-600" : ""
                          )}
                        >
                          {apt.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
