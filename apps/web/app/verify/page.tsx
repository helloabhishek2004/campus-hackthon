"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { InstitutionalLookupResponse } from "@smart-campus/contracts";
import { mockIdentityService } from "@/lib/services/identity-service";
import { IdentityCard } from "@/components/auth/identity-card";
import { CampusGramLogo } from "@/components/layout/logo";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useCampusAuth();

  const idParam = searchParams.get("id") || "";
  const [profile, setProfile] = useState<InstitutionalLookupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function fetchRecord() {
      if (!idParam) {
        setError("No Institutional ID specified. Please enter your College ID first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await mockIdentityService.lookupByInstitutionalId(idParam);
        if (!result) {
          setError(`Institutional ID '${idParam}' was not found in university records.`);
        } else {
          setProfile(result);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to retrieve institutional record.");
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [idParam]);

  const handleVerify = () => {
    if (!profile) return;
    setVerifying(true);
    // Instant mock authentication and session creation
    login(profile);
  };

  return (
    <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-900/40 px-3 py-1 rounded-full uppercase tracking-wider">
          Step 2 • Identity Verification
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Verify your identity
        </h1>
        <p className="text-sm text-zinc-400">
          We matched your institutional registration. Please confirm your details below.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-400">Retrieving institutional directory record...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 rounded-2xl border border-red-900/50 bg-red-950/30 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-200">Record Not Found</h3>
            <p className="text-xs text-red-300/80">{error}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>
        </div>
      )}

      {/* Profile Card & Confirmation */}
      {profile && !loading && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <IdentityCard
            profile={profile}
            variant="verification"
            footerAction={
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-zinc-400">
                    Is this you? Confirm to enter your campus portal.
                  </p>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Authenticated Session...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <Link
                    href="/login"
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Not you?</span>
                    <span className="text-blue-400 underline underline-offset-2">
                      Try another ID
                    </span>
                  </Link>
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 selection:bg-zinc-800">
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <CampusGramLogo size="md" />
        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
          Verification
        </span>
      </header>

      <Suspense
        fallback={
          <div className="max-w-md w-full mx-auto my-auto py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-400">Loading identity details...</p>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>

      <footer className="max-w-md w-full mx-auto text-center border-t border-zinc-900 pt-6">
        <p className="text-xs text-zinc-600">
          CampusGram utilizes institutional records with zero unauthenticated phone disclosure.
        </p>
      </footer>
    </div>
  );
}
