"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { DocumentTabs } from "@/components/documents/document-tabs";
import {
  Bell,
  Sparkles,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useCampusAuth();

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Student";

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 -mb-10 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-900/50 text-blue-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>Spring Semester 2026 • Campus Active</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                {getGreeting()}, {firstName} 👋
              </h1>

              <p className="text-sm text-zinc-400 leading-relaxed">
                Here&apos;s what&apos;s happening on campus. All your institutional credentials,
                academic certificates, and campus services in one unified place.
              </p>
            </div>

            {/* Quick Campus Snapshot Card */}
            <div className="grid grid-cols-2 gap-3 shrink-0 self-start md:self-auto">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-center">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Department
                </p>
                <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">
                  {user?.departmentCode || "CAMPUS"}
                </p>
                <p className="text-[10px] text-zinc-400">Regular Stream</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-center">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Attendance
                </p>
                <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  88%
                </p>
                <p className="text-[10px] text-emerald-500">Above Threshold</p>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1">
              Campus Portals:
            </span>

            <Link
              href="/lost-and-found"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 hover:border-zinc-600 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Lost & Found Hub</span>
              <ArrowRight className="w-3 h-3 text-zinc-500" />
            </Link>

            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 hover:border-zinc-600 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>All Documents</span>
              <ArrowRight className="w-3 h-3 text-zinc-500" />
            </Link>
          </div>
        </section>

        {/* Academic & Non-Academic Document Section */}
        <section className="space-y-4">
          <DocumentTabs initialTab="academic" />
        </section>
      </div>
    </AppShell>
  );
}
