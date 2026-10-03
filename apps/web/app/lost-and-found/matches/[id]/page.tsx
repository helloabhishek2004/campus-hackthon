"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@smart-campus/ui";
import { ArrowLeft, CheckCircle, ShieldAlert, ScanSearch, RefreshCw } from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function MatchReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/lost-found/matches/single/${id}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data.match);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleClaim = async () => {
    if (!consent) return alert("You must agree to the privacy protocol");
    setClaiming(true);
    try {
      const res = await fetch(`/api/lost-found/matches/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerConsent: true }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/lost-and-found/claims/${data.claim.id}`);
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to initiate claim");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="text-xs">Loading match evaluation...</span>
        </div>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-3">
          <p className="text-sm font-semibold text-red-400">Match record not found.</p>
          <Link href="/lost-and-found" className="text-xs text-zinc-400 hover:text-zinc-200 underline">
            &larr; Back to Lost & Found
          </Link>
        </div>
      </AppShell>
    );
  }

  const foundItem = match.found_item;
  const matchScore = (match.overall_score * 100).toFixed(0);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Item
        </button>

        <Card className="border-zinc-800 bg-zinc-900/70 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="bg-zinc-950/60 border-b border-zinc-800 p-5 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
                <ScanSearch className="w-5 h-5 text-zinc-300" />
                <span>AI Multimodal Match Review</span>
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-1">
                Our semantic model matched this found item against your lost report.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-200">
              {matchScore}% Match
            </span>
          </CardHeader>
          <CardContent className="p-5 space-y-5 text-xs">
            <div className="space-y-3">
              <h3 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] border-b border-zinc-800 pb-2">
                Found Item Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase">Title</p>
                  <p className="font-medium text-zinc-200 mt-0.5">{foundItem?.title}</p>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase">Found Location</p>
                  <p className="font-medium text-zinc-200 mt-0.5">
                    {foundItem?.location_description}
                  </p>
                </div>
                <div className="sm:col-span-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase">Public Notes</p>
                  <p className="text-zinc-300 mt-0.5 leading-relaxed">
                    {foundItem?.public_description}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-900/50 p-3.5 rounded-xl flex gap-3 text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Custody Verification Protocol</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/90 leading-relaxed">
                  <li>You will answer a verification challenge regarding private identifying features.</li>
                  <li>Physical custody handover is completed at the Central Security Desk.</li>
                  <li>Contact details are shared only after identity verification is passed.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-zinc-100 focus:ring-zinc-400 accent-zinc-800"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span className="text-zinc-300 text-xs leading-relaxed select-none">
                  I consent to initiate verification and agree to present my institutional ID at the Campus Security Desk.
                </span>
              </label>

              <Button
                onClick={handleClaim}
                disabled={!consent || claiming}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {claiming ? "Initiating Claim..." : "Proceed with Claim"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
