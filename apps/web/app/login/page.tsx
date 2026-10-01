"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CollegeIdForm } from "@/components/auth/college-id-form";
import { CampusGramLogo } from "@/components/layout/logo";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useCampusAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Header */}
      <header className="max-w-sm w-full mx-auto flex items-center justify-between">
        <CampusGramLogo size="md" />
        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
          Access
        </span>
      </header>

      {/* Main Login Form */}
      <main className="max-w-sm w-full mx-auto my-auto py-8 space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Institutional access
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your official university ID to access your campus dashboard.
          </p>
        </div>

        <CollegeIdForm />
      </main>

      {/* Footer */}
      <footer className="max-w-sm w-full mx-auto text-center border-t border-zinc-900 pt-5">
        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Verified against institutional directory records</span>
        </p>
      </footer>
    </div>
  );
}
