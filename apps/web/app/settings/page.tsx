"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { resetOnboarding } from "@/lib/auth/client-session";
import { useRouter } from "next/navigation";
import {
  Moon,
  Bell,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  LogOut,
  Laptop,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout, switchDemoUser } = useCampusAuth();
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
    }, 800);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings & Preferences</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure application appearance, notifications, and demo parameters.
          </p>
        </div>

        {/* Section 1: Appearance */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <div className="flex items-center gap-2.5">
            <Moon className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Appearance & Theme</h2>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-zinc-800/80">
            <div>
              <p className="text-sm font-medium text-zinc-200">Interface Theme</p>
              <p className="text-xs text-zinc-500">Dark-first campus interface for maximum contrast and eye comfort</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700">
              <Check className="w-3.5 h-3.5 text-blue-400" />
              Dark Active
            </span>
          </div>
        </section>

        {/* Section 2: Notifications */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Campus Notifications</h2>
          </div>

          <div className="space-y-3 border-t border-zinc-800/80 pt-3 text-sm">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Academic & Department Announcements</p>
                <p className="text-xs text-zinc-500">Official circulars, exam notifications, and semester schedules</p>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncements(!announcements)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  announcements ? "bg-blue-600" : "bg-zinc-800"
                }`}
                aria-label="Toggle announcements"
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform block mx-1 ${
                    announcements ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Complaint Intelligence Status Updates</p>
                <p className="text-xs text-zinc-500">Alerts when reported grievances are analyzed, routed, or resolved</p>
              </div>
              <button
                type="button"
                onClick={() => setComplaintAlerts(!complaintAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  complaintAlerts ? "bg-blue-600" : "bg-zinc-800"
                }`}
                aria-label="Toggle complaint alerts"
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform block mx-1 ${
                    complaintAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-medium text-zinc-200">Lost & Found Proximity & Match Signals</p>
                <p className="text-xs text-zinc-500">Automatic notifications when high-confidence matches are found</p>
              </div>
              <button
                type="button"
                onClick={() => setLostFoundAlerts(!lostFoundAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  lostFoundAlerts ? "bg-blue-600" : "bg-zinc-800"
                }`}
                aria-label="Toggle lost and found alerts"
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform block mx-1 ${
                    lostFoundAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Privacy & Security */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Institutional Privacy Standards</h2>
          </div>

          <div className="border-t border-zinc-800/80 pt-3 text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p>
              • <strong>Zero Unauthenticated Phone Disclosure:</strong> All institutional identity lookups strictly mask registered contact numbers.
            </p>
            <p>
              • <strong>Pre-existing Biodata Source of Truth:</strong> Profiles are drawn directly from official university catalog seeds.
            </p>
          </div>
        </section>

        {/* Section 4: Demo & Testing Controls (Judge Friendly) */}
        <section className="p-6 rounded-2xl border border-amber-900/40 bg-zinc-900/90 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Judge & Developer Controls</h2>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-950/80 border border-amber-800/60 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
              Hackathon Mode
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Easily reset user onboarding state or switch active personas during demonstrations:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Reset Onboarding Button */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Reset Onboarding Tour</p>
                <p className="text-xs text-zinc-500">
                  Clears local storage flag so the 3-step intro slides can be viewed again.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetOnboarding}
                disabled={resetSuccess}
                className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {resetSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reset! Redirecting to tour...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Onboarding State</span>
                  </>
                )}
              </button>
            </div>

            {/* Switch Personas */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Switch Demo Persona</p>
                <p className="text-xs text-zinc-500">
                  Change active user to test student vs faculty vs department head views.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => switchDemoUser("STU2026001")}
                  className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-center"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser("FAC1001")}
                  className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 text-center"
                >
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser("FAC1011")}
                  className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-zinc-700 text-center"
                >
                  HOD
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <button
              onClick={logout}
              className="py-2.5 px-4 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Current Session</span>
            </button>
          </div>
        </section>

        {/* Section 5: About CampusGram */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-500 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-semibold">
            <span>CampusGram Portal</span>
            <span>Version 1.0 (Hackathon Edition)</span>
          </div>
          <p>
            Monorepo Module 1 (Campus Application) seamlessly integrated with Module 2 (AI Intelligence) and Module 3 (Lost & Found).
          </p>
        </section>
      </div>
    </AppShell>
  );
}
