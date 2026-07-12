"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Settings, Users, LogOut, MessageSquare, BarChart3, Scissors, Tags, Briefcase, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/inbox", icon: MessageSquare, label: "AI Inbox" },
  { href: "/dashboard/appointments", icon: CalendarDays, label: "Appointments" },
  { href: "/dashboard/clients", icon: Users, label: "Clients" },
  { href: "/dashboard/categories", icon: Tags, label: "Categories" },
  { href: "/dashboard/services", icon: Scissors, label: "Services" },
  { href: "/dashboard/staff", icon: Briefcase, label: "Staff" },
  { href: "/dashboard/staff/analytics", icon: TrendingUp, label: "Performance" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-white md:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-16">
        <Link className="flex items-center gap-2 font-bold" href="/">
          <span className="text-xl tracking-tighter text-zinc-900">
            Salon<span className="text-blue-600">Flow</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-zinc-900",
                  isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-500"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Link href="/">
          <Button variant="outline" className="w-full justify-start text-zinc-500" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </Link>
      </div>
    </aside>
  );
}
