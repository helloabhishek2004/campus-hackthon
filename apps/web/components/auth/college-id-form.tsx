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
          <label htmlFor="college-id-input" className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 font-mono tracking-wide focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors text-sm disabled:opacity-50"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-start gap-2 text-xs text-red-300"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !institutionalId.trim()}
          className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:cursor-not-allowed shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
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
      <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono text-zinc-400 uppercase tracking-wider">
            Demo Credentials
          </span>
          <span className="font-mono text-zinc-500 text-[10px]">Tap to fill</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDemoId("STU2026001")}
            className="text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-2 py-1 rounded transition-colors"
          >
            STU2026001 <span className="text-[10px] text-zinc-500">(Student)</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoId("FAC1001")}
            className="text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-2 py-1 rounded transition-colors"
          >
            FAC1001 <span className="text-[10px] text-zinc-500">(Faculty)</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoId("FAC1011")}
            className="text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-2 py-1 rounded transition-colors"
          >
            FAC1011 <span className="text-[10px] text-zinc-500">(HOD)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
