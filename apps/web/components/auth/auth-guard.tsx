"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InstitutionalLookupResponse } from "@smart-campus/contracts";
import {
  getMockSession,
  setMockSession,
  clearMockSession,
  isOnboardingCompleted,
} from "../../lib/auth/client-session";
import { isMockAuthMode } from "../../lib/auth/client-session";
import { createClient as createSupabaseBrowserClient } from "../../lib/supabase/client";
import { mockIdentityService } from "../../lib/services/identity-service";
import { Loader2 } from "lucide-react";
import { CampusGramLogo } from "../layout/logo";

interface AuthContextValue {
  user: InstitutionalLookupResponse | null;
  loading: boolean;
  login: (profile: InstitutionalLookupResponse) => void;
  logout: () => void;
  switchDemoUser: (institutionalId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<InstitutionalLookupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"mock" | "supabase" | null>(null);
  const router = useRouter();

  // Load session from storage on mount
  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      if (authMode === "mock" || (authMode === null && isMockAuthMode())) {
        if (!cancelled) setUser(getMockSession());
      } else {
        try {
          const response = await fetch("/api/auth/session", { cache: "no-store" });
          const data = await response.json();
          if (data.mode === "mock" || data.mode === "supabase") setAuthMode(data.mode);
          if (!cancelled) setUser(data.profile || null);
        } catch {
          if (!cancelled) setUser(null);
        }
      }
      if (!cancelled) setLoading(false);
    }
    void loadSession();

    const handleSessionChanged = () => {
      if (authMode === "mock" || (authMode === null && isMockAuthMode())) setUser(getMockSession());
    };

    window.addEventListener("campusgram:session_changed", handleSessionChanged);
    window.addEventListener("storage", handleSessionChanged);
    const supabase = createSupabaseBrowserClient();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (!isMockAuthMode()) void loadSession();
    });

    return () => {
      window.removeEventListener("campusgram:session_changed", handleSessionChanged);
      window.removeEventListener("storage", handleSessionChanged);
      listener.subscription.unsubscribe();
      cancelled = true;
    };
  }, [authMode]);

  const login = (profile: InstitutionalLookupResponse) => {
    if (authMode === "mock" || (authMode === null && isMockAuthMode())) setMockSession(profile);
    setUser(profile);
    router.push("/home");
  };

  const logout = () => {
    if (authMode === "mock" || (authMode === null && isMockAuthMode())) {
      clearMockSession();
      void fetch("/api/auth/logout", { method: "POST" });
    }
    else void createSupabaseBrowserClient().auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const switchDemoUser = async (institutionalId: string) => {
    const profile = await mockIdentityService.lookupByInstitutionalId(institutionalId);
    if (profile) {
      if (authMode === "mock" || (authMode === null && isMockAuthMode())) setMockSession(profile);
      setUser(profile);
      router.push("/home");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCampusAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useCampusAuth must be used within an AuthProvider");
  }
  return ctx;
}

/**
 * Route protection wrapper for authenticated pages (/home, /documents, /profile, /settings).
 * Redirects unauthenticated users to /login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCampusAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // If onboarding hasn't been completed yet, send to onboarding first
      if (!isOnboardingCompleted()) {
        router.replace("/onboarding");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <CampusGramLogo size="lg" />
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400" />
          <span>Verifying Campus Session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
