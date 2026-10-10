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
import { ArrowLeft, ShieldAlert, ScanSearch, RefreshCw } from "lucide-react";
import { readWorkflowResponse, workflowCapabilities, WorkflowRequestError, type WorkflowCapabilities } from "../../_lib/workflow-client";

export default function MatchReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [consent, setConsent] = useState(false);
  const [claimText, setClaimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<WorkflowCapabilities>({});
  const [existingClaimId, setExistingClaimId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        setMatch(null);
        setError(null);
        setCapabilities({});
        setExistingClaimId(null);
        setConsent(false);
        setClaimText("");
        const data = await readWorkflowResponse(await fetch(`/api/lost-found/matches/single/${id}`, { cache: "no-store", signal: controller.signal }));
        if (!controller.signal.aborted) {
          setMatch(data.match);
          setCapabilities(workflowCapabilities(data.capabilities ?? data.match?.capabilities));
          setExistingClaimId(data.existingClaimId ?? data.match?.existing_claim_id ?? null);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load this match.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void fetchData();
    return () => controller.abort();
  }, [id]);

  const handleClaim = async () => {
    if (!consent || !capabilities.canClaim || claimText.trim().length < 5 || claiming) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(`/api/lost-found/matches/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerConsent: true, claimText: claimText.trim() }),
      });
      const data = await readWorkflowResponse(res);
      if (data.claim?.id) {
        router.push(`/lost-and-found/claims/${data.claim.id}`);
      } else {
        throw new Error("The claim response did not include a claim reference.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to initiate claim.");
      if (err instanceof WorkflowRequestError && err.status === 409) {
        try {
          const data = await readWorkflowResponse(await fetch(`/api/lost-found/matches/single/${id}`, { cache: "no-store" }));
          setMatch(data.match);
          setCapabilities(workflowCapabilities(data.capabilities));
          setExistingClaimId(data.existingClaimId ?? null);
        } catch { setCapabilities({}); }
      }
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="text-xs">Loading match evaluation...</span>
        </div>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-3">
          <p role="alert" className="text-sm font-semibold text-destructive">{error || "Match record not found."}</p>
          <Link href="/lost-and-found" className="text-xs text-muted-foreground hover:text-foreground underline">
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
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Item
        </button>

        <Card className="border-border bg-card rounded-xl overflow-hidden shadow-xs">
          <CardHeader className="bg-muted/40 border-b border-border p-5 flex flex-col sm:flex-row gap-3 items-start justify-between">
            <div>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <ScanSearch className="w-5 h-5 text-muted-foreground" />
                <span>Match Review</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                The CampusGram matching pipeline identified this candidate from the available item signals. This score is not a probability or ownership confirmation.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-muted border border-border text-foreground">
              {matchScore}% Similarity
            </span>
          </CardHeader>
          <CardContent className="p-5 space-y-5 text-xs">
            {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">{error}</p>}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px] border-b border-border pb-2">
                Found Item Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted/40 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Title</p>
                  <p className="font-medium text-foreground mt-0.5">{foundItem?.title}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Found Location</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {foundItem?.location_description}
                  </p>
                </div>
                <div className="sm:col-span-2 bg-muted/40 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Public Notes</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    {foundItem?.public_description}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex gap-3 text-foreground">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-600 dark:text-amber-400">Custody Verification Protocol</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
                  <li>You will answer a verification challenge regarding private identifying features.</li>
                  <li>The finder reviews your answers before approving a handover.</li>
                  <li>Contact release requires approval, consent, and an active contact window.</li>
                  <li>A handover process is selected after approval; a match alone does not confirm custody.</li>
                </ul>
              </div>
            </div>

            {existingClaimId ? (
              <Link href={`/lost-and-found/claims/${existingClaimId}`}><Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs">Continue Existing Claim &rarr;</Button></Link>
            ) : capabilities.canClaim ? (
            <div className="space-y-3 pt-3 border-t border-border">
              <label className="block space-y-2 text-foreground">
                <span>Explain why this could be your item</span>
                <textarea value={claimText} onChange={(event) => setClaimText(event.target.value)} minLength={5} maxLength={2000} rows={3} disabled={claiming}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition-all" />
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded bg-background border-input text-primary focus:ring-ring accent-primary"
                   checked={consent}
                  disabled={claiming}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span className="text-foreground text-xs leading-relaxed select-none">
                  I consent to initiate ownership verification and to the authorized handover contact process after approval.
                </span>
              </label>

              <Button
                onClick={handleClaim}
                disabled={!consent || claimText.trim().length < 5 || claiming}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {claiming ? "Initiating Claim..." : "Continue to Verification Answers"}
              </Button>
            </div>
            ) : <p className="border-t border-border pt-3 text-muted-foreground">Only the eligible lost-item reporter can initiate a claim. No claim action is currently available for this match.</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
