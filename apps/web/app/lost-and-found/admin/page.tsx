"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@smart-campus/ui";
import {
  ShieldAlert,
  ArrowLeft,
  Activity,
  Users,
  Eye,
  CheckCircle2,
  Play,
  RefreshCw,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function AdminDashboardPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/lost-found/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const triggerCron = async (jobName: string) => {
    try {
      const res = await fetch(`/api/lost-found/admin/crons/${jobName}`, { method: "POST" });
      const data = await res.json();
      alert(data.message || "Cron Triggered");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
          <div className="space-y-1">
            <Link
              href="/lost-and-found"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium mb-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Lost & Found
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-zinc-200" />
              <span>Custody & Audit Desk</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Audit log of campus contact reveals, ownership claims, and physical custody handovers.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={refreshing}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerCron("expire")}
              className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <Play className="w-3 h-3 mr-1 text-zinc-500" /> Expire Items
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerCron("windows")}
              className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <Play className="w-3 h-3 mr-1 text-zinc-500" /> Close Windows
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-300 text-xs font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-400" /> Contact Reveals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-zinc-100 font-mono">
                {logs.filter((l) => l.type === "contact_reveal").length}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Audit verified disclosures</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Handover Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                {logs.filter((l) => l.type === "claim").length}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Total claims processed</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-300 text-xs font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" /> Item Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-zinc-100 font-mono">
                {logs.filter((l) => l.type === "item_event").length}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">State machine transitions</p>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Table */}
        <Card className="border-zinc-800 bg-zinc-900/60 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/80 px-4 py-3 bg-zinc-950/40">
            <CardTitle className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" /> Audit Log Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                <span className="text-xs">Loading audit logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs font-medium">
                No recent security desk activity recorded.
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-xs text-left text-zinc-300">
                  <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-950/60 border-b border-zinc-800 font-mono">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Timestamp</th>
                      <th className="px-4 py-3 font-semibold">Event Type</th>
                      <th className="px-4 py-3 font-semibold">Details / Reason</th>
                      <th className="px-4 py-3 font-semibold">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {logs.map((log, i) => (
                      <tr key={log.id || i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                          {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded font-medium border",
                              log.type === "contact_reveal"
                                ? "bg-red-950/80 text-red-300 border-red-800"
                                : log.type === "claim"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                                : "bg-zinc-800 text-zinc-300 border-zinc-700"
                            )}
                          >
                            {log.type.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{log.action}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                          {log.actor_id || "System"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
