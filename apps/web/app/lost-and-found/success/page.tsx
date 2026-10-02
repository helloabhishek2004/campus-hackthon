"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@smart-campus/ui";
import {
  CheckCircle2,
  Search,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  Package,
} from "lucide-react";

type MatchStatus = "processing" | "scanning" | "match_found" | "no_match";

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // "lost" | "found"
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
        return; // keep polling
      }

      if (data.found && data.match) {
        setMatch(data.match);
        setStatus("match_found");
        return; // stop polling
      }

      // After 8 polls (~8 seconds) with no match, give up gracefully
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

    // Start with "scanning" state after 500ms
    const initialDelay = setTimeout(() => setStatus("scanning"), 500);

    // Poll every 1.5 seconds
    const interval = setInterval(() => {
      pollForMatches();
    }, 1500);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [pollForMatches, type, itemId]);

  // ── FOUND ITEM submitted ─────────────────────────────
  if (type === "found") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-14 h-14 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Found Item Reported!</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Thank you for reporting this item. Our AI is actively scanning lost item reports for
          potential matches. If a match is found, the owner will be notified immediately.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          {itemId && (
            <Link href={`/lost-and-found/items/${itemId}`}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                View Item Details <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          <Link href="/lost-and-found">
            <Button variant="outline" className="w-full text-slate-700">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── LOST ITEM submitted — show AI scanning states ────
  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">

      {/* ── Processing / Scanning ── */}
      {(status === "processing" || status === "scanning") && (
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-40" />
            <div className="relative w-28 h-28 bg-purple-100 rounded-full flex items-center justify-center">
              <Search className="w-14 h-14 text-purple-600 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lost Report Submitted!</h1>
            <p className="text-purple-700 font-semibold mt-1 text-sm">
              🔍 AI is scanning the Found Items directory…
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse inline-block" />
              Running CLIP image similarity model
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              Running MiniLM text embedding model
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Calculating weighted match scores
            </p>
          </div>
          <p className="text-xs text-slate-400">This usually takes 2–5 seconds…</p>
        </div>
      )}

      {/* ── MATCH FOUND ── */}
      {status === "match_found" && match && (
        <div className="space-y-5">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">Your Item Was Found! 🎉</h1>
            <p className="text-slate-500 text-sm">
              Our AI matched your report with a found item in the directory.
            </p>
          </div>

          {/* AI Match confidence */}
          <div className="flex items-center justify-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
              ${match.band === 'high' ? 'bg-emerald-100 text-emerald-700' :
                match.band === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'}`}>
              {match.band === 'high' ? 'Strong Match' : match.band === 'medium' ? 'Possible Match' : 'Weak Match'}
            </div>
            <span className="text-sm text-slate-500 font-medium">
              {match.score}% AI Confidence
            </span>
          </div>

          {/* Matched Item card */}
          <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                <Package className="w-3 h-3" /> Matched Found Item
              </p>
            </div>

            {/* Image if available */}
            {match.matchedItem?.images?.length > 0 && (
              <div className="h-48 bg-slate-100 overflow-hidden">
                <img
                  src={match.matchedItem.images[0].public_url}
                  alt={match.matchedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-2">
              <h3 className="font-bold text-slate-800 text-lg">{match.matchedItem?.title}</h3>
              <p className="text-slate-600 text-sm">{match.matchedItem?.public_description}</p>
              {match.matchedItem?.location_description && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Found at: {match.matchedItem.location_description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-blue-900 text-base">
              📞 Contact the Finder
            </h3>
            <p className="text-xs text-blue-700">
              This information is logged and shared only with verified users. Please coordinate item handover at campus security.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-blue-100">
                <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-bold text-slate-800 font-mono">{match.contact.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-blue-100">
                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-bold text-slate-800">{match.contact.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-blue-100">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Note from Finder</p>
                  <p className="text-slate-700 text-sm">{match.contact.note}</p>
                </div>
              </div>
            </div>
          </div>

          <Link href="/lost-and-found">
            <Button variant="outline" className="w-full text-slate-700">Return to Dashboard</Button>
          </Link>
        </div>
      )}

      {/* ── NO MATCH ── */}
      {status === "no_match" && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">No Match Found Yet</h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Your lost item report has been saved. No matching found items are in the directory right
              now, but you will be automatically matched as soon as someone reports finding it.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 text-left space-y-1">
            <p>✅ Report saved permanently</p>
            <p>✅ AI will auto-match new found reports</p>
            <p>✅ You will be notified immediately on a match</p>
          </div>
          <div className="flex flex-col gap-3">
            {itemId && (
              <Link href={`/lost-and-found/items/${itemId}`}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  View Your Report <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/lost-and-found/browse">
              <Button variant="outline" className="w-full text-slate-700">Browse Found Items</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Search className="w-14 h-14 text-purple-600" />
          </div>
          <p className="text-slate-500 text-sm">Loading your report…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
