"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { useTheme } from "@/components/theme/theme-context";
import { resetOnboarding } from "@/lib/auth/client-session";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Bell,
  ShieldCheck,
  RotateCcw,
  Check,
  LogOut,
  Sliders,
  FileCheck,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function SettingsPage() {
  const { user, logout, switchDemoUser } = useCampusAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState(true);
  const [complaintAlerts, setComplaintAlerts] = useState(true);
  const [lostFoundAlerts, setLostFoundAlerts] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetOnboarding = () => {
    resetOnboarding();
    setResetSuccess(true);
    setTimeout(() => {
      router.push("/onboarding");
    }, 700);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-zinc-800 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Settings & Preferences
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage application appearance, alerts, and institutional data preferences.
          </p>
        </header>

        {/* Section 1: Appearance */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-zinc-400" />
            ) : (
              <Sun className="w-4 h-4 text-zinc-600" />
            )}
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Appearance & Theme
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">Interface Appearance</p>
                <p className="text-zinc-500">
                  Switch between Apple-inspired Dark and Light monochrome modes.
                </p>
              </div>
            </div>

            {/* Segmented Theme Cards */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Dark Option */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "apple-press flex items-center justify-between p-3.5 rounded-xl border text-left transition-all",
                  theme === "dark"
                    ? "bg-zinc-950 text-white border-zinc-700 shadow-md ring-1 ring-zinc-500"
                    : "bg-zinc-100 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-100">Dark Mode</p>
                    <p className="text-[10px] text-zinc-400 font-mono">Zinc monochrome</p>
                  </div>
                </div>
                {theme === "dark" && (
                  <Check className="w-4 h-4 text-zinc-100" />
                )}
              </button>

              {/* Light Option */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "apple-press flex items-center justify-between p-3.5 rounded-xl border text-left transition-all",
                  theme === "light"
                    ? "bg-white text-zinc-900 border-zinc-400 shadow-md ring-1 ring-zinc-400"
                    : "bg-zinc-100 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-800">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Light Mode</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Clean monochrome</p>
                  </div>
                </div>
                {theme === "light" && (
                  <Check className="w-4 h-4 text-zinc-900" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Notifications */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
            <Bell className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
              Notifications
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Campus Circulars & Notices</p>
                <p className="text-zinc-500">Official circulars, exam schedules, and department notices</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={announcements}
                onClick={() => setAnnouncements(!announcements)}
                className={`w-9 h-5 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                  announcements ? "bg-zinc-200" : "bg-zinc-800"
                }`}
                aria-label="Toggle circular notifications"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-transform block mx-0.5 ${
                    announcements ? "translate-x-4 bg-zinc-950" : "translate-x-0 bg-zinc-400"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Complaint Intelligence Status Updates</p>
                <p className="text-zinc-500">Alerts when reported issues are analyzed or routed</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={complaintAlerts}
                onClick={() => setComplaintAlerts(!complaintAlerts)}
                className={`w-9 h-5 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                  complaintAlerts ? "bg-zinc-200" : "bg-zinc-800"
                }`}
                aria-label="Toggle complaint alert notifications"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-transform block mx-0.5 ${
                    complaintAlerts ? "translate-x-4 bg-zinc-950" : "translate-x-0 bg-zinc-400"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Lost & Found Proximity Alerts</p>
                <p className="text-zinc-500">Alerts when verified item matches are reported in custody</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lostFoundAlerts}
                onClick={() => setLostFoundAlerts(!lostFoundAlerts)}
                className={`w-9 h-5 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                  lostFoundAlerts ? "bg-zinc-200" : "bg-zinc-800"
                }`}
                aria-label="Toggle lost and found alerts"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-transform block mx-0.5 ${
                    lostFoundAlerts ? "translate-x-4 bg-zinc-950" : "translate-x-0 bg-zinc-400"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Privacy & Security */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
              Privacy Standards
            </h2>
          </div>

          <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p>
              • <strong>Phone Number Masking:</strong> Contact numbers remain masked across all unauthenticated endpoints.
            </p>
            <p>
              • <strong>Canonical Biodata Authority:</strong> Identity records are populated from official institutional catalogs.
            </p>
          </div>
        </section>

        {/* Section 4: Demo & Testing Controls */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Testing Controls
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Local Mode</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Reset Onboarding Tour</p>
                <p className="text-zinc-500">Clears client flag so the three intro screens can be reviewed again.</p>
              </div>
              <button
                type="button"
                onClick={handleResetOnboarding}
                disabled={resetSuccess}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {resetSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Reset</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-850">
              <span className="text-zinc-500 block mb-2 font-medium">Switch Active Demo Persona</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => switchDemoUser("STU2026001")}
                  className="py-1.5 px-2 rounded-md text-xs font-mono bg-zinc-950 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 text-center"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser("FAC1001")}
                  className="py-1.5 px-2 rounded-md text-xs font-mono bg-zinc-950 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 text-center"
                >
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser("FAC1011")}
                  className="py-1.5 px-2 rounded-md text-xs font-mono bg-zinc-950 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 text-center"
                >
                  HOD
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80">
            <button
              onClick={logout}
              className="w-full py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sign Out of Current Session</span>
            </button>
          </div>
        </section>

        {/* Section 5: About */}
        <footer className="text-center text-[11px] text-zinc-500 font-mono pt-4">
          CampusGram • Version 1.0 (Release Candidate) • Smart Campus Monorepo
        </footer>
      </div>
    </AppShell>
  );
}
