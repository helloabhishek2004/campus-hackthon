"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CollegeIdForm } from "@/components/auth/college-id-form";
import { CampusGramLogo } from "@/components/layout/logo";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { ShieldCheck, HelpCircle } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useCampusAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 selection:bg-zinc-800">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <CampusGramLogo size="md" />
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
          Institutional Auth
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Enter your College ID
          </h1>
          <p className="text-sm text-zinc-400">
            Sign in with your official university registration number to access campus services.
          </p>
        </div>

        <CollegeIdForm />
      </main>

      {/* Footer Info */}
      <footer className="max-w-md w-full mx-auto text-center border-t border-zinc-900 pt-6">
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>No manual registration required. Identity verified via university directory.</span>
        </p>
      </footer>
    </div>
  );
}
