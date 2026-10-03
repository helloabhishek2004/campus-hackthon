"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@smart-campus/ui";
import {
  CheckCircle2,
  Search,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ScanSearch,
  Package,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

type MatchStatus = "processing" | "scanning" | "match_found" | "no_match";

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const itemId = searchParams.get("id");

  const [status, setStatus] = useState<MatchStatus>("processing");
  const [match, setMatch] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);

  const pollForMatches = useCallback(async () => {
    if (!itemId || type !== "lost") return;

    try {
      const res = await fetch(`/api/lost-found/items/${itemId}/check-matches`);
      const data = await res.json();

      if (data.status === "processing") {
        setStatus("scanning");
        return;
      }

      if (data.found && data.match) {
        setMatch(data.match);
        setStatus("match_found");
        return;
      }

      setPollCount((c) => {
        const next = c + 1;
        if (next >= 8) setStatus("no_match");
        return next;
      });
    } catch {
      // silently continue polling
    }
  }, [itemId, type]);

  useEffect(() => {
    if (type !== "lost" || !itemId) return;

    const initialDelay = setTimeout(() => setStatus("scanning"), 500);
    const interval = setInterval(() => {
      pollForMatches();
    }, 1500);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [pollForMatches, type, itemId]);

  // Found item submitted
  if (type === "found") {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Found Item Registered</h1>
          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
            Thank you for turning in this item. The AI matching worker is scanning lost item reports. 
            If a match is confirmed, the verified owner will be prompted for security desk custody handover.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 pt-2">
          {itemId && (
            <Link href={`/lost-and-found/items/${itemId}`}>
              <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs font-semibold py-2">
                <span>View Item Details</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
          <Link href="/lost-and-found">
            <Button
              variant="outline"
              className="w-full border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              Return to Lost & Found
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Lost item submitted — show AI scanning states
  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      {(status === "processing" || status === "scanning") && (
        <div className="text-center space-y-5">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-zinc-700/20 animate-ping" />
            <div className="relative w-20 h-20 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-200">
              <ScanSearch className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Lost Report Submitted</h1>
            <p className="text-zinc-400 font-medium text-xs mt-1">
              Matching engine is scanning found items catalog...
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left space-y-2 text-xs text-zinc-400">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse inline-block" />
              <span>Generating semantic description vector embedding</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse inline-block" />
              <span>Matching against similarity catalog</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Calculating composite match threshold</span>
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">This usually takes 2–4 seconds...</p>
        </div>
      )}

      {status === "match_found" && match && (
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <ScanSearch className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-emerald-400">Potential Match Located</h1>
            <p className="text-zinc-400 text-xs">
              Found an item matching your description in campus custody.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border",
                match.band === "high"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : "bg-amber-950/80 text-amber-300 border-amber-800"
              )}
            >
              {match.band === "high" ? "High Confidence" : "Possible Match"}
            </span>
            <span className="text-xs text-zinc-400 font-mono font-medium">
              {match.score}% Similarity
            </span>
          </div>

          {/* Matched card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="bg-zinc-950/60 px-4 py-2.5 border-b border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
              <Package className="w-3.5 h-3.5 text-zinc-400" />
              <span>Matched Item Preview</span>
            </div>

            {match.matchedItem?.images?.length > 0 && (
              <div className="h-44 bg-zinc-950 overflow-hidden">
                <img
                  src={match.matchedItem.images[0].public_url}
                  alt={match.matchedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-zinc-100 text-sm">{match.matchedItem?.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {match.matchedItem?.public_description}
              </p>
              {match.matchedItem?.location_description && (
                <p className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                  <MapPin className="w-3 h-3" /> Found at: {match.matchedItem.location_description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          {match.contact && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-zinc-400" /> Verified Custody Contact
              </h3>
              <p className="text-[11px] text-zinc-400">
                Coordinated handovers must occur at the Campus Security Desk with student ID.
              </p>
              <div className="space-y-2 pt-1 text-xs">
                {match.contact.phone && (
                  <div className="flex items-center gap-2.5 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Phone</p>
                      <p className="font-mono text-zinc-200 font-semibold">{match.contact.phone}</p>
                    </div>
                  </div>
                )}
                {match.contact.email && (
                  <div className="flex items-center gap-2.5 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Email</p>
                      <p className="text-zinc-200">{match.contact.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Link href="/lost-and-found" className="flex-1">
              <Button variant="outline" className="w-full border-zinc-800 bg-zinc-900 text-zinc-300 text-xs">
                Lost & Found Home
              </Button>
            </Link>
            {itemId && (
              <Link href={`/lost-and-found/items/${itemId}`} className="flex-1">
                <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs font-semibold">
                  Inspect Item
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {status === "no_match" && (
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Report Saved to Registry</h1>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
              No matching found item was discovered in the current catalog. Your report is permanently active, 
              and the AI matcher will alert you as soon as a match is submitted.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {itemId && (
              <Link href={`/lost-and-found/items/${itemId}`}>
                <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs font-semibold py-2">
                  View My Item Status <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
            <Link href="/lost-and-found/browse">
              <Button variant="outline" className="w-full border-zinc-800 bg-zinc-900 text-zinc-300 text-xs">
                Browse Found Catalog
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
            <span className="text-xs">Loading report confirmation...</span>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </AppShell>
  );
}
