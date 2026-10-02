"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button
} from "@smart-campus/ui";
import { ShieldAlert, ArrowLeft, Activity, Users, Eye, CheckCircle2, Play, RefreshCw } from "lucide-react";

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
        setLogs(data.logs);
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
    
    // Auto-refresh every 10 seconds to catch worker updates!
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const triggerCron = async (jobName: string) => {
      try {
          const res = await fetch(`/api/lost-found/admin/crons/${jobName}`, { method: 'POST' });
          const data = await res.json();
          alert(data.message || "Triggered");
      } catch(e) {
          console.error(e);
      }
  };

  const getBadgeColor = (type: string) => {
      switch(type) {
          case 'contact_reveal': return 'destructive';
          case 'claim': return 'default';
          case 'item_event': return 'secondary';
          default: return 'outline';
      }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
             <Link href="/lost-and-found" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
             </Link>
             <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-red-600" />
                Security & Audit Desk
             </h1>
             <p className="text-slate-500">View recent campus contact reveals, claims, and item reports.</p>
         </div>
         <div className="flex gap-2 flex-wrap justify-end">
             <Button variant="outline" size="sm" onClick={fetchLogs} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> 
                Refresh
             </Button>
             <Button variant="outline" size="sm" onClick={() => triggerCron('expire')}>
                <Play className="w-4 h-4 mr-2" /> Expire Items
             </Button>
             <Button variant="outline" size="sm" onClick={() => triggerCron('windows')}>
                <Play className="w-4 h-4 mr-2" /> Close Windows
             </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-red-50 border-red-100 shadow-sm">
             <CardHeader className="pb-2">
                 <CardTitle className="text-red-900 text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" /> Contact Reveals
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <p className="text-4xl font-extrabold text-red-700">{logs.filter(l => l.type === 'contact_reveal').length}</p>
                 <p className="text-sm text-red-600 mt-1 font-medium">In the last 7 days</p>
             </CardContent>
         </Card>
         <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
             <CardHeader className="pb-2">
                 <CardTitle className="text-emerald-900 text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Handover Claims
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <p className="text-4xl font-extrabold text-emerald-700">{logs.filter(l => l.type === 'claim').length}</p>
                 <p className="text-sm text-emerald-600 mt-1 font-medium">Total claims submitted</p>
             </CardContent>
         </Card>
         <Card className="bg-blue-50 border-blue-100 shadow-sm">
             <CardHeader className="pb-2">
                 <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Item Events
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <p className="text-4xl font-extrabold text-blue-700">{logs.filter(l => l.type === 'item_event').length}</p>
                 <p className="text-sm text-blue-600 mt-1 font-medium">Reports & Updates</p>
             </CardContent>
         </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
         <CardHeader className="bg-slate-50 border-b border-slate-100">
             <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5 text-slate-500" /> Comprehensive Audit Log
             </CardTitle>
         </CardHeader>
         <CardContent className="p-0">
             {loading ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-slate-300 mb-2" />
                    Loading audit logs...
                </div>
             ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-medium">No system activity found.</div>
             ) : (
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-white border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Timestamp</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Action / Reason</th>
                                <th className="px-6 py-4 font-semibold">Actor / Subject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={log.id || i} className="bg-white border-b last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={getBadgeColor(log.type)}>
                                            {log.type.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 bg-slate-50/50 rounded p-2 m-2 inline-block">
                                        {log.actor_id}
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
  );
}
