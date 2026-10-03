"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from "@smart-campus/ui";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Info,
  AlertTriangle,
  Lock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [item, setItem] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mocking current user ID for demonstration
  const currentUserId = "33333333-3333-3333-3333-333333330001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/lost-found/items/${id}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data.item);

          // If current user is the owner, fetch matches
          if (data.item.reporter_id === currentUserId) {
            const matchesRes = await fetch(`/api/lost-found/items/${id}/matches`);
            if (matchesRes.ok) {
              const matchesData = await matchesRes.json();
              setMatches(matchesData.matches || []);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch item details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="text-xs">Loading item details...</span>
        </div>
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-3">
          <p className="text-sm font-semibold text-red-400">Item not found.</p>
          <Link
            href="/lost-and-found/browse"
            className="text-xs text-zinc-400 hover:text-zinc-200 underline"
          >
            &larr; Return to directory
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOwner = item.reporter_id === currentUserId;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/lost-and-found/browse"
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded font-bold border",
                    item.type === "lost"
                      ? "bg-red-950/80 text-red-300 border-red-800"
                      : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  )}
                >
                  {item.type.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                  {item.status?.replace("_", " ")}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 capitalize">
                  {item.category?.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{item.title}</h1>
            </div>

            {item.images?.length > 0 ? (
              <div className="aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                <img
                  src={item.images[0].public_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                No photo provided for this report
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Location
                  </p>
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {item.location_description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Event Date
                  </p>
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {format(new Date(item.event_date || item.created_at), "MMM d, yyyy - h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <Info className="w-4 h-4 text-purple-400" /> Public Description
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {item.public_description || "No public notes provided."}
              </p>

              {isOwner && item.identifying_marks && (
                <div className="mt-3 p-3 bg-purple-950/30 rounded-lg border border-purple-900/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Private Identifying Marks (Hidden from Public)</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed">
                    {item.identifying_marks}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: AI Matches (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/60 rounded-xl overflow-hidden">
              <CardHeader className="bg-zinc-950/60 border-b border-zinc-800/80 p-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    AI Match Candidates
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs space-y-1">
                    <p className="font-medium text-zinc-400">No match candidates yet</p>
                    <p className="text-[11px] text-zinc-600">
                      Our multimodal embeddings worker continuously scans newly filed items.
                    </p>
                  </div>
                ) : (
                  matches.map((match) => {
                    const otherItem = item.type === "lost" ? match.found_item : match.lost_item;
                    if (!otherItem) return null;

                    return (
                      <div
                        key={match.id}
                        className="border border-zinc-800 rounded-lg p-3 space-y-2 hover:border-purple-500/50 transition-colors bg-zinc-950/60"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-xs text-zinc-100 line-clamp-1">
                            {otherItem.title}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 shrink-0 font-bold">
                            {(match.overall_score * 100).toFixed(0)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {otherItem.public_description}
                        </p>
                        <div className="pt-2 border-t border-zinc-800/80">
                          <Link href={`/lost-and-found/matches/${match.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-7 border-zinc-800 bg-zinc-900 text-purple-300 hover:bg-zinc-800"
                            >
                              Review & Verify Match &rarr;
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
