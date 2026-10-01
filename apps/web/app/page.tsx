"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboardingCompleted, getMockSession } from "@/lib/auth/client-session";
import { CampusGramLogo } from "@/components/layout/logo";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. If onboarding has never been completed, guide user through onboarding
    if (!isOnboardingCompleted()) {
      router.replace("/onboarding");
      return;
    }

    // 2. If user already has an active mock session, jump directly to /home
    const session = getMockSession();
    if (session) {
      router.replace("/home");
      return;
    }

    // 3. Otherwise, go to login
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <CampusGramLogo size="lg" />
      <div className="flex items-center gap-2 mt-6 text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span>Initializing CampusGram...</span>
      </div>
    </div>
  );
}
