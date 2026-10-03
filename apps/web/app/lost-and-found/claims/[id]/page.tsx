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
import { ArrowLeft, Clock, CheckCircle2, XCircle, Users, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function ClaimReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);

  // Mocking current user ID
  const currentUserId = "33333333-3333-3333-3333-333333330001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/lost-found/claims/single/${id}`);
        if (res.ok) {
          const data = await res.json();
          setClaim(data.claim);

          if (data.claim.status === "approved") {
            const contactRes = await fetch(`/api/lost-found/claims/${id}/contact`);
            if (contactRes.ok) {
              const contactData = await contactRes.json();
              setContact(contactData);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDecision = async (decision: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/lost-found/claims/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: "Decision recorded from UI console" }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to record decision");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="text-xs">Loading claim status...</span>
        </div>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-3">
          <p className="text-sm font-semibold text-red-400">Claim not found.</p>
          <Link href="/lost-and-found" className="text-xs text-zinc-400 hover:text-zinc-200 underline">
            &larr; Back to Lost & Found
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOwner = claim.claimant_id === currentUserId;
  const isFinder = claim.item?.reporter_id === currentUserId;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <Card className="border-zinc-800 bg-zinc-900/70 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="bg-zinc-950/60 border-b border-zinc-800 p-5 flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Custody Claim Verification</span>
            </CardTitle>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border",
                claim.status === "approved"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : claim.status === "rejected"
                  ? "bg-red-950/80 text-red-300 border-red-800"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              )}
            >
              {claim.status?.replace("_", " ")}
            </span>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-xs">
            {/* State: Pending */}
            {claim.status === "pending" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Verification in Progress</h3>
                  <p className="text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {isOwner
                      ? "Waiting for the custody officer or finder to verify your responses."
                      : "A student is claiming this item. Review their verification details below."}
                  </p>
                </div>

                {isFinder && (
                  <div className="flex gap-3 justify-center pt-4 border-t border-zinc-800 mt-4">
                    <Button
                      onClick={() => handleDecision("rejected")}
                      variant="outline"
                      className="border-red-900/60 text-red-300 bg-red-950/30 hover:bg-red-900/40 text-xs"
                    >
                      Reject Claim
                    </Button>
                    <Button
                      onClick={() => handleDecision("approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Verify & Approve Handover
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* State: Approved */}
            {claim.status === "approved" && (
              <div className="space-y-5">
                <div className="text-center py-2 space-y-1.5">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Claim Approved</h3>
                  <p className="text-zinc-400">Proceed to campus security desk for handover.</p>
                </div>

                {contact && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                    <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2 uppercase tracking-wider">
                      <Users className="w-4 h-4 text-purple-400" /> Authorized Contact Details
                    </h4>
                    {contact.mode === "in_person" ? (
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                        <p className="text-zinc-400">{contact.contact.name}</p>
                        <p className="font-mono text-sm font-semibold text-zinc-100">
                          {contact.contact.phone}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                        Please present this claim reference at the{" "}
                        <strong className="text-zinc-100">
                          {contact.mode === "campus_security"
                            ? "Campus Security Desk (Main Gate)"
                            : "Department Office"}
                        </strong>{" "}
                        to complete physical custody verification.
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Security audit token valid for 14 days. Handover will be recorded in the immutable audit log.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* State: Rejected */}
            {claim.status === "rejected" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Claim Not Verified</h3>
                  <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                    The submitted verification details did not match the concealed identifying marks.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
