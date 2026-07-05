"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Power, PowerOff } from "lucide-react";
import { fetchApi } from "@/lib/apiClient";

export default function SuperadminBusinesses() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBusinesses = async () => {
    try {
      const response = await fetchApi('/superadmin/businesses');
      setBusinesses(response);
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const toggleStatus = async (id: string) => {
    try {
      await fetchApi(`/superadmin/businesses/${id}/status`, { method: 'PATCH' });
      fetchBusinesses(); // Refresh list
    } catch (err) {
      console.error("Failed to toggle status", err);
      alert("Failed to update status");
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400">Loading tenants...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Tenants Directory</h2>
        <p className="text-zinc-400">Manage all businesses using the platform.</p>
      </div>

      <div className="border border-zinc-800 rounded-md bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Business Name</TableHead>
              <TableHead className="text-zinc-400">Owner Contact</TableHead>
              <TableHead className="text-zinc-400">Plan</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.length === 0 ? (
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                  No businesses found.
                </TableCell>
              </TableRow>
            ) : (
              businesses.map((biz) => {
                const owner = biz.users?.[0]; // Get the first owner
                return (
                  <TableRow key={biz.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-zinc-200">
                      <div>{biz.name}</div>
                      <div className="text-xs text-zinc-500">/{biz.slug}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      <div>{owner?.email || biz.email || 'N/A'}</div>
                      <div className="text-xs text-zinc-500">{owner?.phone || biz.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-purple-500 text-purple-400 bg-purple-500/10">
                        {biz.subscriptionPlan || "TRIAL"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {new Date(biz.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {biz.isActive ? (
                        <Badge className="bg-green-500/10 text-green-500 border-none">Active</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500 border-none">Suspended</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(biz.id)}
                        className={biz.isActive ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}
                      >
                        {biz.isActive ? (
                          <><PowerOff className="w-4 h-4 mr-2" /> Suspend</>
                        ) : (
                          <><Power className="w-4 h-4 mr-2" /> Activate</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
