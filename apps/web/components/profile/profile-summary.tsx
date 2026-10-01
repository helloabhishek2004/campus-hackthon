"use client";

import React from "react";
import { useCampusAuth } from "../auth/auth-guard";
import { IdentityCard } from "../auth/identity-card";
import { LogOut, ArrowLeft, RefreshCw, KeyRound, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function ProfileSummary() {
  const { user, logout, switchDemoUser } = useCampusAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Institutional Profile</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Canonical identity verified via Campus Registrar Directory
          </p>
        </div>

        <Link
          href="/home"
          className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Identity Card reused from verification */}
      <IdentityCard
        profile={user}
        variant="profile"
        footerAction={
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={logout}
                className="flex-1 py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-900/50 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of CampusGram</span>
              </button>
            </div>
          </div>
        }
      />

      {/* Quick Role Switcher for Hackathon Testing */}
      <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Quick Persona Switcher (Judge & Dev Mode)
          </h4>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Test how CampusGram immediately adapts UI fields, tags, and credentials across different
          institutional personas:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => switchDemoUser("STU2026001")}
            className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-left transition-colors text-xs space-y-1"
          >
            <p className="font-semibold text-emerald-400">Student Persona</p>
            <p className="text-[11px] text-zinc-400 font-mono">Aarav Sharma (STU2026001)</p>
          </button>

          <button
            onClick={() => switchDemoUser("FAC1001")}
            className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-left transition-colors text-xs space-y-1"
          >
            <p className="font-semibold text-blue-400">Faculty Persona</p>
            <p className="text-[11px] text-zinc-400 font-mono">Dr. Sundar Pichai (FAC1001)</p>
          </button>

          <button
            onClick={() => switchDemoUser("FAC1011")}
            className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-left transition-colors text-xs space-y-1"
          >
            <p className="font-semibold text-purple-400">HOD Persona</p>
            <p className="text-[11px] text-zinc-400 font-mono">Dr. Aris Thorne (FAC1011)</p>
          </button>
        </div>
      </div>
    </div>
  );
}
