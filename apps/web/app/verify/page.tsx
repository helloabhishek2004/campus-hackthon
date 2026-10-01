"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { InstitutionalLookupResponse } from "@smart-campus/contracts";
import { mockIdentityService } from "@/lib/services/identity-service";
import { IdentityCard } from "@/components/auth/identity-card";
import { CampusGramLogo } from "@/components/layout/logo";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, Check } from "lucide-react";
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
          setError(`Institutional ID '${idParam}' was not found in directory records.`);
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
    login(profile);
  };

  return (
    <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Verify your identity
        </h1>
        <p className="text-xs text-zinc-400">
          Please confirm the institutional record associated with your ID.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-10 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-center justify-center space-y-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <p className="text-xs text-zinc-400">Retrieving institutional directory record...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 rounded-xl border border-red-900/50 bg-red-950/30 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-red-200">Record Not Found</h3>
            <p className="text-xs text-red-300/80">{error}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>
        </div>
      )}

      {/* Profile Card & Confirmation */}
      {profile && !loading && (
        <div className="space-y-4">
          <IdentityCard
            profile={profile}
            variant="verification"
            footerAction={
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                      <span>Opening Session...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Not you?</span>
                    <span className="underline underline-offset-4 text-zinc-400">
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <CampusGramLogo size="md" />
        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
          Verification
        </span>
      </header>

      <Suspense
        fallback={
          <div className="max-w-md w-full mx-auto my-auto py-12 flex flex-col items-center justify-center space-y-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            <p className="text-xs text-zinc-500">Loading record...</p>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>

      <footer className="max-w-md w-full mx-auto text-center border-t border-zinc-900 pt-5">
        <p className="text-xs text-zinc-500">
          Institutional records are protected. Phone numbers remain masked for privacy.
        </p>
      </footer>
    </div>
  );
}
