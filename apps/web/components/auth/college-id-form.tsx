"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { mockIdentityService } from "../../lib/services/identity-service";
import { InstitutionalLookupRequestSchema, InstitutionalLookupResponse } from "@smart-campus/contracts";
import { cn } from "@smart-campus/utils";

interface CollegeIdFormProps {
  onSuccess?: (profile: InstitutionalLookupResponse) => void;
  className?: string;
}

export function CollegeIdForm({ onSuccess, className }: CollegeIdFormProps) {
  const [institutionalId, setInstitutionalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmed = institutionalId.trim().toUpperCase();

    // Client schema validation
    const validation = InstitutionalLookupRequestSchema.safeParse({ institutionalId: trimmed });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Please enter a valid College ID.");
      return;
    }

    setLoading(true);

    try {
      const profile = await mockIdentityService.lookupByInstitutionalId(trimmed);

      if (!profile) {
        setError("College ID not found. Please check your institutional ID and try again.");
        return;
      }

      if (!profile.isActive) {
        setError("This institutional ID is marked inactive. Please contact administration.");
        return;
      }

      if (onSuccess) {
        onSuccess(profile);
      } else {
        router.push(`/verify?id=${encodeURIComponent(trimmed)}`);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during identity lookup.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoId = (id: string) => {
    setInstitutionalId(id);
    setError(null);
  };

  return (
    <div className={cn("w-full max-w-sm mx-auto space-y-5", className)}>
      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <label htmlFor="college-id-input" className="mb-1.5 block text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400">
            College ID
          </label>
          <div className="relative">
            <input
              id="college-id-input"
              type="text"
              value={institutionalId}
              onChange={(e) => {
                setInstitutionalId(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="e.g. STU2026001"
              disabled={loading}
              autoFocus
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 font-mono text-sm tracking-wide text-zinc-900 placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
            <div className="space-y-0.5">
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !institutionalId.trim()}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Verifying ID...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Demo helper box for hackathon judges */}
      <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Demo Credentials
          </span>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">Tap to fill</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDemoId("STU2026001")}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-mono text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            STU2026001 <span className="text-[10px] text-zinc-500">(Student)</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoId("FAC1001")}
             className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-mono text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            FAC1001 <span className="text-[10px] text-zinc-500">(Faculty)</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoId("FAC1011")}
             className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-mono text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            FAC1011 <span className="text-[10px] text-zinc-500">(HOD)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
