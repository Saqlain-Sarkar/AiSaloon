"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, Building2, Users, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (!user || user.role !== "SUPER_ADMIN") {
    return null;
  }

  const sidebarLinks = [
    {
      name: "Overview",
      href: "/superadmin",
      icon: LayoutDashboard,
    },
    {
      name: "Tenants (Businesses)",
      href: "/superadmin/businesses",
      icon: Building2,
    },
    {
      name: "Global Users",
      href: "/superadmin/users",
      icon: Users,
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar (Dark Theme for SuperAdmin) */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <Link href="/superadmin" className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-white">AiSalonOS <span className="text-red-500">Admin</span></span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-red-500/10 text-red-500" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-sm">
              SA
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-zinc-500 truncate">Super Administrator</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950">
        <header className="h-16 flex items-center px-8 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
          <h1 className="text-xl font-semibold text-zinc-100">Super Admin Console</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
