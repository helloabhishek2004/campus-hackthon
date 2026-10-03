"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@smart-campus/ui";
import {
  Search,
  PlusCircle,
  PackageSearch,
  ShieldCheck,
  ScanSearch,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function LostAndFoundDashboard() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold tracking-wider">
                Module 3
              </span>
              <span className="text-xs text-zinc-500 font-mono">Lost & Found Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <span>Lost & Found Network</span>
              <ScanSearch className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
              Multimodal matching engine pairing text descriptions and photos. Private item details remain 
              hidden until ownership claim is verified at the Campus Security Desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/lost-and-found/my-reports"
              className="apple-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>My Reports & Claims</span>
            </Link>
            <Link
              href="/lost-and-found/admin"
              className="apple-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Admin Desk</span>
            </Link>
          </div>
        </div>

        {/* Primary Action Cards (Strictly Monochrome) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lost Item */}
          <Link href="/lost-and-found/report/lost" className="group apple-press">
            <Card className="apple-card h-full border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all rounded-xl">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ScanSearch className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>I Lost Something</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Submit a report with location, approximate timestamp, and description. Our background engine continuously searches for matches.
                </p>
              </CardContent>
              <CardFooter className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                File Lost Report &rarr;
              </CardFooter>
            </Card>
          </Link>

          {/* Found Item */}
          <Link href="/lost-and-found/report/found" className="group apple-press">
            <Card className="apple-card h-full border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all rounded-xl">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>I Found Something</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Report an item you discovered on campus. Sensitive identifying features are masked from public view for fraud prevention.
                </p>
              </CardContent>
              <CardFooter className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                Submit Found Item &rarr;
              </CardFooter>
            </Card>
          </Link>

          {/* Browse Catalog (Monochrome - Dark Blue Removed) */}
          <Link href="/lost-and-found/browse" className="group apple-press">
            <Card className="apple-card h-full border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all rounded-xl">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Browse Item Catalog</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Search active items reported across campus buildings, filter by item category, and submit verification claims.
                </p>
              </CardContent>
              <CardFooter className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                Explore Directory &rarr;
              </CardFooter>
            </Card>
          </Link>
        </div>

        {/* System Safeguards & Protocol Strip */}
        <div className="bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
              Verification & Custody Handover Protocol
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-300">
                <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono flex items-center justify-center text-zinc-600 dark:text-zinc-400">1</span>
                <span>Multimodal Matching</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Images and descriptions are embedded into high-dimensional vector space for semantic similarity scoring.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-300">
                <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono flex items-center justify-center text-zinc-600 dark:text-zinc-400">2</span>
                <span>Zero-Knowledge Questions</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Claimants must describe distinguishing private marks (wallpaper, scratches, contents) without seeing raw answers.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-300">
                <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono flex items-center justify-center text-zinc-600 dark:text-zinc-400">3</span>
                <span>Physical Custody Desk</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Reunited valuables are signed off at the Central Campus Security Control Room with institutional photo ID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
