"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@smart-campus/ui";
import {
  ArrowLeft,
  Clock,
  PackageSearch,
  CheckCircle2,
  RefreshCw,
  MapPin,
  ExternalLink,
  ScanSearch,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function MyReportsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lost-found/items");
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <Link
              href="/lost-and-found"
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium mb-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Lost & Found
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0">
                <img src="/assets/campus_gram_icon.svg" alt="CampusGram" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                My Reports & Claims
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Track status of items you reported, AI match alerts, and active custody handovers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/lost-and-found/report/lost"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              + Report Lost
            </Link>
            <button
              onClick={fetchItems}
              disabled={loading}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
            <span className="text-xs">Loading reported items...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-500 space-y-3">
            <PackageSearch className="w-10 h-10 text-zinc-700 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-zinc-300">No active reports filed</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Items you report as lost or found will appear here alongside potential matches.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/lost-and-found/report/lost"
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                I Lost Something
              </Link>
              <Link
                href="/lost-and-found/report/found"
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                I Found Something
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="border-zinc-800 bg-zinc-900/60 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded font-bold border",
                          item.type === "lost"
                            ? "bg-red-950/80 text-red-300 border-red-800"
                            : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        )}
                      >
                        {item.type === "lost" ? "LOST REPORT" : "FOUND REPORT"}
                      </span>

                      <span className="text-[10px] font-mono text-zinc-500">
                        {item.status?.toUpperCase() || "OPEN"}
                      </span>
                    </div>

                    <CardTitle className="text-sm font-semibold text-zinc-100 line-clamp-1">
                      {item.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="px-4 pb-3 space-y-2">
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.public_description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      <span>{item.location_description}</span>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-2 pb-3 px-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">
                    {format(new Date(item.event_date || item.created_at), "MMM d, yyyy")}
                  </span>

                  <Link
                    href={`/lost-and-found/items/${item.id}`}
                    className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium transition-colors"
                  >
                    <span>View Matches</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
