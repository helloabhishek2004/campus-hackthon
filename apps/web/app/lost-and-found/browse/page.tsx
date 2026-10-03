"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@smart-campus/ui";
import { Search, MapPin, Calendar, Image as ImageIcon, ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { cn } from "@smart-campus/utils";

type Item = {
  id: string;
  type: "lost" | "found";
  title: string;
  category: string;
  public_description: string;
  location_description: string;
  event_date: string;
  status: string;
  images: any[];
};

export default function BrowseItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const fetchItems = React.useCallback(async () => {
    // Abort previous in-flight request to avoid race condition
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      let url = "/api/lost-found/items";
      if (filterType !== "all") {
        url += `?type=${filterType}`;
      }
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to fetch items:", err);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [filterType]);

  useEffect(() => {
    fetchItems();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchItems]);

  const formatSafeDate = (d?: string) => {
    if (!d) return "Recently";
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return "Recently";
      return format(parsed, "MMM d");
    } catch {
      return "Recently";
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.public_description?.toLowerCase().includes(q) ||
        item.location_description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
          <div>
            <Link
              href="/lost-and-found"
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium mb-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Lost & Found
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Campus Item Directory
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Browse recently reported lost valuables and found items registered across campus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setFilterType("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  filterType === "all"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("lost")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  filterType === "lost"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Lost
              </button>
              <button
                onClick={() => setFilterType("found")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  filterType === "found"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Found
              </button>
            </div>

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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by keywords (e.g. calculator, keys, blue bottle, library)..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
          />
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-zinc-900/50 border border-zinc-800/80 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 space-y-2">
            <Layers className="w-8 h-8 text-zinc-700 mx-auto" />
            <p className="text-xs font-semibold text-zinc-300">No items match your criteria</p>
            <p className="text-[11px] text-zinc-500">
              Try adjusting your search query or switching filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Link key={item.id} href={`/lost-and-found/items/${item.id}`} className="group block">
                <Card className="h-full border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700/80 transition-all rounded-xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="h-44 bg-zinc-950 flex items-center justify-center text-zinc-600 relative overflow-hidden border-b border-zinc-800/60">
                      {item.images && item.images.length > 0 && item.images[0].public_url ? (
                        <img
                          src={item.images[0].public_url}
                          alt={item.title}
                          onError={(e) => {
                            // Graceful fallback on broken image link
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 opacity-40 text-zinc-600" />
                      )}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded font-bold border",
                            item.type === "lost"
                              ? "bg-red-950/80 text-red-300 border-red-800"
                              : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                          )}
                        >
                          {item.type === "lost" ? "LOST" : "FOUND"}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-zinc-300 border border-zinc-700/60 capitalize">
                          {item.category?.replace("_", " ") || "General"}
                        </span>
                      </div>
                    </div>

                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {item.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="px-4 pb-3 space-y-3">
                      <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px] leading-relaxed">
                        {item.public_description || "No public notes provided."}
                      </p>
                    </CardContent>
                  </div>

                  <div className="px-4 py-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1 truncate max-w-[55%]">
                      <MapPin className="w-3 h-3 shrink-0 text-zinc-500" />
                      <span className="truncate">{item.location_description}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 shrink-0 text-zinc-500" />
                      <span>{formatSafeDate(item.event_date)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
