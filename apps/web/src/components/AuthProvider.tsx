"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchApi } from "@/lib/apiClient";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  businessId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("accessToken");
      
      // If we are on public routes (home, login, register, book), don't block
      const isPublicRoute = 
        pathname === "/" || 
        pathname.startsWith("/auth/") || 
        pathname.startsWith("/book");
        
      if (!token) {
        setIsLoading(false);
        if (!isPublicRoute) {
          router.push("/auth/login");
        }
        return;
      }

      try {
        // Fetch current user from API
        // For now, if there's no /me endpoint, we decode token or just trust it.
        // Let's assume we decode the JWT token directly for efficiency on the frontend
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
            let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
              base64 += '=';
            }
            const decodedPayload = JSON.parse(decodeURIComponent(escape(atob(base64))));
            setUser({
                id: decodedPayload.sub,
                email: decodedPayload.email,
                role: decodedPayload.role,
                businessId: decodedPayload.businessId,
            });
        }
      } catch (error) {
        console.error("Auth validation failed", error);
        localStorage.removeItem("accessToken");
        if (!isPublicRoute) {
          router.push("/auth/login");
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
