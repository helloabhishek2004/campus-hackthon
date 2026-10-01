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
  const router = useRouter();

  // Load session from storage on mount
  useEffect(() => {
    const session = getMockSession();
    setUser(session);
    setLoading(false);

    const handleSessionChanged = () => {
      setUser(getMockSession());
    };

    window.addEventListener("campusgram:session_changed", handleSessionChanged);
    window.addEventListener("storage", handleSessionChanged);

    return () => {
      window.removeEventListener("campusgram:session_changed", handleSessionChanged);
      window.removeEventListener("storage", handleSessionChanged);
    };
  }, []);

  const login = (profile: InstitutionalLookupResponse) => {
    setMockSession(profile);
    setUser(profile);
    router.push("/home");
  };

  const logout = () => {
    clearMockSession();
    setUser(null);
    router.push("/login");
  };

  const switchDemoUser = async (institutionalId: string) => {
    const profile = await mockIdentityService.lookupByInstitutionalId(institutionalId);
    if (profile) {
      setMockSession(profile);
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <CampusGramLogo size="lg" />
        <div className="flex items-center gap-2 mt-6 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Verifying Campus Session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
