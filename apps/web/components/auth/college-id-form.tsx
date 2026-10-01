"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
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

    // 1. Client schema validation
    const validation = InstitutionalLookupRequestSchema.safeParse({ institutionalId: trimmed });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Please enter a valid College ID.");
      return;
    }

    setLoading(true);

    try {
      // 2. Call identity service
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
    <div className={cn("w-full max-w-md mx-auto space-y-6", className)}>
      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <label htmlFor="college-id-input" className="block text-sm font-semibold text-zinc-200 mb-2">
            Institutional College ID
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
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 font-mono tracking-wider focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-base disabled:opacity-50"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{error}</p>
              {error.includes("not found") && (
                <p className="text-red-400/80">
                  Tip: Use the demo ID below to test the verified student flow.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !institutionalId.trim()}
          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:shadow-none transition-all duration-200 disabled:text-zinc-500 disabled:cursor-not-allowed group active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying Institutional ID...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Demo helper box for hackathon judges */}
      <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Demo Quick Fill
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
            Mock Seed
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Click any institutional role below to instantly load demo credentials:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setDemoId("STU2026001")}
            className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>STU2026001</span>
            <span className="text-[10px] text-zinc-400 font-sans">(Student)</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoId("FAC1001")}
            className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-blue-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>FAC1001</span>
            <span className="text-[10px] text-zinc-400 font-sans">(Faculty)</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoId("FAC1011")}
            className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>FAC1011</span>
            <span className="text-[10px] text-zinc-400 font-sans">(HOD)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
