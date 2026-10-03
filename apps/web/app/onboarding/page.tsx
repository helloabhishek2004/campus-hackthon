"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { isOnboardingCompleted, getMockSession } from "@/lib/auth/client-session";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // If onboarding is already completed and user is logged in, redirect to home
    if (isOnboardingCompleted() && getMockSession()) {
      router.replace("/home");
    }
  }, [router]);

  return <OnboardingScreen />;
}
