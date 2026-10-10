"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HandoverModeSchema, type HandoverMode } from "@smart-campus/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@smart-campus/ui";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Users, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@smart-campus/utils";
import { useCurrentUser } from "../../_lib/use-current-user";
import { normalizeVerificationAnswers, readWorkflowResponse, workflowCapabilities, WorkflowRequestError, WorkflowClaimSchema, type WorkflowClaim, type WorkflowCapabilities } from "../../_lib/workflow-client";

const identifyingQuestion = "Describe private identifying features that establish this item is yours.";
const modeLabels: Record<HandoverMode, string> = {
  in_person: "In person",
  campus_security: "Campus Security",
  department_office: "Department Office",
};
const fieldClass = "w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition-all";

export default function ClaimReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { userId, loading: sessionLoading, error: sessionError } = useCurrentUser();
  const [claim, setClaim] = useState<WorkflowClaim | null>(null);
  const [capabilities, setCapabilities] = useState<WorkflowCapabilities>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<HandoverMode>("campus_security");
  const [handoverConfirmed, setHandoverConfirmed] = useState(false);
  const [contact, setContact] = useState<any>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const applyClaim = useCallback((data: any) => {
    const parsedClaim = WorkflowClaimSchema.safeParse(data.claim);
    if (!parsedClaim.success) throw new Error("The server did not return a valid claim record.");
    const loaded = parsedClaim.data;
    setClaim(loaded);
    setCapabilities(workflowCapabilities(data.capabilities ?? data.claim?.capabilities));
    const saved = Array.isArray(loaded.verification_answers) ? loaded.verification_answers : [];
    const requestedQuestions = Array.isArray(data.claim.verification_questions)
      ? data.claim.verification_questions.filter((question: unknown): question is string => typeof question === "string" && Boolean(question.trim())) : [];
    const questions: string[] = requestedQuestions.length
      ? requestedQuestions : saved.length ? saved.map((entry) => entry.question) : [identifyingQuestion];
    setAnswers(questions.map((question: string) => ({
      question,
      answer: saved.find((entry) => entry.question === question)?.answer || "",
    })));
    const parsedMode = HandoverModeSchema.safeParse(loaded.handover_mode);
    if (parsedMode.success) setMode(parsedMode.data);
  }, []);

  const refreshClaim = useCallback(async () => {
    const data = await readWorkflowResponse(await fetch(`/api/lost-found/claims/single/${id}`, { cache: "no-store" }));
    applyClaim(data);
  }, [id, applyClaim]);

  useEffect(() => {
    if (sessionLoading) return;
    const controller = new AbortController();
    setLoading(true);
    setClaim(null);
    setCapabilities({});
    setContact(null);
    setContactError(null);
    setError(null);
    setMessage(null);
    async function load() {
      try {
        if (!userId) throw new Error(sessionError || "Sign in to view this claim.");
        const data = await readWorkflowResponse(await fetch(`/api/lost-found/claims/single/${id}`, { cache: "no-store", signal: controller.signal }));
        if (!controller.signal.aborted) applyClaim(data);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load this claim.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, userId, sessionLoading, sessionError, applyClaim]);

  const submitAction = async (action: string, body: unknown, successMessage: string) => {
    if (busy) return;
    setBusy(action);
    setError(null);
    setMessage(null);
    setContact(null);
    try {
      const data = await readWorkflowResponse(await fetch(`/api/lost-found/claims/${id}/${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }));
      setMessage(data.message || successMessage);
      try {
        await refreshClaim();
      } catch {
        setCapabilities({});
        setError("The action was recorded, but the updated claim status could not be loaded. Refresh Status before taking another action.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update this claim.");
      if (e instanceof WorkflowRequestError && e.status === 409) {
        try { await refreshClaim(); } catch { setCapabilities({}); }
      }
    } finally {
      setBusy(null);
    }
  };

  const revealContact = async () => {
    if (busy) return;
    setBusy("contact");
    setContact(null);
    setContactError(null);
    try {
      setContact(await readWorkflowResponse(await fetch(`/api/lost-found/claims/${id}/contact`, { cache: "no-store" })));
    } catch (e) {
      setContactError(e instanceof Error ? e.message : "Contact details are unavailable.");
    } finally {
      setBusy(null);
    }
  };

  if (loading || sessionLoading) return (
    <AppShell><div className="py-20 flex flex-col items-center gap-2 text-muted-foreground">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="text-xs">Loading claim status...</span>
    </div></AppShell>
  );

  if (!claim) return (
    <AppShell><div className="py-20 text-center space-y-3">
      <p role="alert" className="text-sm font-semibold text-destructive">{error || "Claim not found."}</p>
      <Link href="/lost-and-found" className="text-xs text-muted-foreground hover:text-foreground underline">&larr; Back to Lost & Found</Link>
    </div></AppShell>
  );

  const pending = claim.status === "pending" || claim.status === "questions_pending";
  const approved = claim.status === "approved";
  const handover = claim.status === "handover";
  const savedAnswers = Array.isArray(claim.verification_answers) ? claim.verification_answers : [];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <button onClick={() => router.back()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <Link href="/lost-and-found/my-reports" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">My Reports & Claims</Link>
          <Button variant="outline" disabled={Boolean(busy)} onClick={async () => {
            setBusy("refresh"); setError(null); setContact(null);
            try { await refreshClaim(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to refresh claim."); }
            finally { setBusy(null); }
          }} className="text-xs border-border bg-card text-foreground hover:bg-muted">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", busy === "refresh" && "animate-spin")} /> Refresh Status
          </Button>
        </div>
        <Card className="border-border bg-card rounded-xl overflow-hidden shadow-xs">
          <CardHeader className="bg-muted/40 border-b border-border p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-foreground text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-foreground" /> Custody Claim Verification</CardTitle>
            <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border",
              approved || handover ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : claim.status === "rejected" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-muted text-foreground border-border")}>
              {claim.status?.replaceAll("_", " ")}
            </span>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-xs">
            {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">{error}</p>}
            {message && <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">{message}</p>}
            <p className="font-mono text-[10px] text-muted-foreground break-all">Claim reference: {claim.id}</p>
            {claim.item && <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <Link href={`/lost-and-found/items/${claim.item.id}`} className="font-semibold text-foreground underline break-words">{claim.item.title}</Link>
              <p className="text-muted-foreground whitespace-pre-wrap break-words">{claim.item.public_description}</p>
            </div>}

            {pending && (
              <>
                <div className="text-center py-2 space-y-3">
                  <Clock className="w-8 h-8 mx-auto text-amber-500" />
                  <h3 className="font-semibold text-foreground text-sm">{claim.status === "questions_pending" ? "Verification Answers Requested" : savedAnswers.length ? "Awaiting Finder Review" : "Ownership Verification"}</h3>
                  <p className="text-muted-foreground leading-relaxed">{capabilities.isClaimant
                    ? "Provide private details that the finder can check. A similarity score does not establish ownership."
                    : "Review the claimant’s explanation and verification answers before recording a decision."}</p>
                </div>
                {claim.claim_text && <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-1">
                  <h4 className="font-semibold text-foreground">Claim explanation</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap break-words">{claim.claim_text}</p>
                </div>}
                {capabilities.canAnswer && (
                  <form className="space-y-3" onSubmit={(event) => {
                    event.preventDefault();
                    try {
                      const normalized = normalizeVerificationAnswers(answers);
                      void submitAction("answer", { answers: normalized }, "Verification answers saved. Awaiting finder review.");
                    } catch (e) { setError(e instanceof Error ? e.message : "Complete all verification answers."); }
                  }}>
                    {answers.map((entry, index) => <label key={`${entry.question}-${index}`} className="block space-y-2 text-foreground">
                      <span>{entry.question}</span>
                      <textarea required maxLength={2000} rows={3} className={fieldClass} value={entry.answer} disabled={Boolean(busy)}
                        onChange={(event) => setAnswers((current) => current.map((answer, i) => i === index ? { ...answer, answer: event.target.value } : answer))} />
                    </label>)}
                    <p className="text-[11px] text-muted-foreground">These answers are for authorized claim review, not the public item catalog. Do not include phone numbers or other contact details.</p>
                    <Button type="submit" disabled={Boolean(busy) || answers.some((entry) => !entry.answer.trim())} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
                      {busy === "answer" ? "Saving Answers..." : savedAnswers.length ? "Update Verification Answers" : "Submit Verification Answers"}
                    </Button>
                  </form>
                )}
                {!capabilities.isClaimant && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Submitted Verification Answers</h4>
                    {savedAnswers.length ? savedAnswers.map((entry: any, index: number) => <div key={index} className="bg-muted/30 p-3 rounded-lg border border-border space-y-1">
                      <p className="font-medium text-foreground break-words">{entry.question}</p><p className="whitespace-pre-wrap break-words text-muted-foreground">{entry.answer || "Not answered yet"}</p>
                    </div>) : <p className="text-muted-foreground">The claimant has not submitted verification answers yet.</p>}
                  </div>
                )}
                {capabilities.canDecide && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <label className="block space-y-2 text-foreground"><span>Decision notes (optional)</span>
                      <textarea rows={2} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={Boolean(busy)} className={fieldClass} />
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button disabled={Boolean(busy)} onClick={() => void submitAction("decide", { decision: "rejected", notes: notes.trim() || undefined }, "Claim rejected.")}
                        variant="outline" className="flex-1 border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 text-xs">Reject Claim</Button>
                      <Button disabled={Boolean(busy) || !capabilities.canApprove}
                        onClick={() => void submitAction("decide", { decision: "approved", notes: notes.trim() || undefined }, "Claim approved. Handover can now be arranged.")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">{busy === "decide" ? "Recording Decision..." : "Verify & Approve"}</Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {(approved || handover) && (
              <>
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <h3 className="font-semibold text-foreground text-sm">{handover ? "Handover Recorded" : "Claim Approved"}</h3>
                  <p className="text-muted-foreground">{handover ? `Handover confirmed through ${modeLabels[mode]}. Both linked reports are now resolved.` : "Coordinate the physical exchange through Campus Security. This demo does not store direct phone numbers or email addresses for handover."}</p>
                </div>
                {approved && capabilities.canHandover && (
                  <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (handoverConfirmed) void submitAction("handover", { mode }, "Handover recorded."); }}>
                    <label className="block space-y-2 text-foreground"><span>Handover process</span>
                      <select value={mode} onChange={(event) => setMode(event.target.value as HandoverMode)} disabled={Boolean(busy)} className={fieldClass}>
                        {HandoverModeSchema.options.map((option) => <option key={option} value={option}>{modeLabels[option]}</option>)}
                      </select>
                    </label>
                    <label className="flex items-start gap-2 text-muted-foreground"><input type="checkbox" checked={handoverConfirmed} onChange={(event) => setHandoverConfirmed(event.target.checked)} disabled={Boolean(busy)} className="accent-primary mt-0.5" />I confirm I have received the item through the selected process. Recording handover will resolve both reports.</label>
                    <Button type="submit" disabled={Boolean(busy) || !handoverConfirmed} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">{busy === "handover" ? "Recording Handover..." : "Record Handover"}</Button>
                  </form>
                )}
                <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Handover Contact</h4>
                  {capabilities.canRevealContact ? <Button onClick={() => void revealContact()} disabled={Boolean(busy)} variant="outline" className="text-xs border-border bg-card text-foreground hover:bg-muted">{busy === "contact" ? "Checking Contact Access..." : "View Authorized Contact / Instructions"}</Button>
                    : <p className="text-muted-foreground">Direct contact sharing is unavailable for this claim. Campus Security coordinates the handover; this demo supplies no private phone numbers or email addresses.</p>}
                  {contactError && <p role="alert" className="text-destructive">{contactError}</p>}
                  {contact && <div className="space-y-2 text-muted-foreground">
                    {contact.instructions && <p>{contact.instructions}</p>}
                    {contact.contact ? <div className="bg-muted/40 rounded-lg p-3 border border-border space-y-1">
                      {contact.contact.name && <p>{contact.contact.name}</p>}
                      {contact.contact.phone && <p className="font-mono text-foreground">{contact.contact.phone}</p>}
                      {contact.contact.email && <p className="text-foreground break-all">{contact.contact.email}</p>}
                    </div> : !contact.instructions && <p>No direct contact details were supplied. Coordinate through the selected campus handover process.</p>}
                    {contact.expires_at && <p className="text-[10px] text-muted-foreground">Contact window expires: {new Date(contact.expires_at).toLocaleString()}</p>}
                  </div>}
                </div>
              </>
            )}
            {claim.status === "rejected" && <div className="text-center py-4 space-y-3"><XCircle className="w-10 h-10 mx-auto text-destructive" /><h3 className="font-semibold text-foreground text-sm">Claim Not Approved</h3><p className="text-muted-foreground">The reviewer rejected this claim.</p></div>}
            {claim.status === "withdrawn" && <p className="text-muted-foreground text-center">This claim has been withdrawn.</p>}
            {claim.decision_notes && <div className="border-t border-border pt-3 space-y-1"><p className="font-semibold text-foreground">Reviewer Notes</p><p className="text-muted-foreground whitespace-pre-wrap">{claim.decision_notes}</p></div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
