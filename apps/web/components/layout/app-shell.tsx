"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { MobileHeader, MobileBottomNav } from "./mobile-nav";
import { ProtectedRoute } from "../auth/auth-guard";
import { EmergencyBanner } from "../emergency/emergency-banner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased">
        {/* Desktop Application Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <MobileHeader />

          {/* Real-time Emergency Banner */}
          <EmergencyBanner />

          {/* Page Body with sensible max-width */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl w-full mx-auto pb-24 md:pb-12">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </div>
    </ProtectedRoute>
  );
}
