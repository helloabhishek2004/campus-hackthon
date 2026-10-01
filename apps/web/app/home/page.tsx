"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { DocumentTabs } from "@/components/documents/document-tabs";
import {
  FileText,
  ArrowRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import Link from "next/link";

const RECENT_BULLETINS = [
  {
    id: "not-01",
    title: "Mid-Term Examination Schedule Finalized",
    issuer: "Office of the Controller of Examinations",
    time: "2h ago",
    tag: "Academic",
  },
  {
    id: "not-02",
    title: "Campus Shuttle Route 4 Schedule Revision",
    issuer: "Transport Logistics Cell",
    time: "Yesterday",
    tag: "Transport",
  },
  {
    id: "not-03",
    title: "Innovation Hub Extended Hours Authorization",
    issuer: "Dean of Research & Development",
    time: "2d ago",
    tag: "Facilities",
  },
];

export default function HomePage() {
  const { user } = useCampusAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Student";
  const isStudent = user?.role === "student";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <header className="border-b border-zinc-800/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Here is what is happening across your campus today.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                {user?.institutionalId}
              </span>
              <span className="text-[11px] font-mono capitalize px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400">
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard 2-Column Overview Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Institutional Status Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Institutional Standing
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Enrolled
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100">
                {user?.departmentName || user?.departmentCode || "Institutional Core"}
              </h3>
              {isStudent && user?.programName && (
                <p className="text-xs text-zinc-400">{user.programName}</p>
              )}
              {!isStudent && user?.designation && (
                <p className="text-xs text-zinc-400">{user.designation}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60 text-xs">
              <div>
                <span className="text-zinc-500 block">Class & Level</span>
                <span className="font-mono text-zinc-200 mt-0.5 block">
                  {isStudent
                    ? `Year ${user?.academicYear || 3} • Sem ${user?.semester || 6} (${user?.section || "A"})`
                    : "Faculty Member"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Attendance Standing</span>
                <span className="font-mono text-zinc-200 mt-0.5 block">
                  88% (Verified compliant)
                </span>
              </div>
            </div>
          </div>

          {/* Recent Campus Bulletins */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Recent Bulletins
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Official Feeds</span>
            </div>

            <div className="space-y-2.5">
              {RECENT_BULLETINS.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-950 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-200 font-medium truncate pr-2">
                      {b.title}
                    </span>
                    <span className="text-zinc-500 font-mono shrink-0">{b.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="truncate">{b.issuer}</span>
                    <span className="font-mono text-zinc-400">{b.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Documents Management Section */}
        <section className="pt-2">
          <DocumentTabs initialTab="academic" />
        </section>

        {/* Quick Portal Services Row */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-medium text-zinc-200">Campus Services Navigation</p>
            <p className="text-zinc-500">Quickly report lost items, verify found belongings, or submit maintenance grievances.</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href="/lost-and-found"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium border border-zinc-700 transition-colors"
            >
              <span>Lost & Found Hub</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
