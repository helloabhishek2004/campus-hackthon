"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { DesktopTopBar } from "./topbar";
import { MobileHeader, MobileBottomNav } from "./mobile-nav";
import { ProtectedRoute } from "../auth/auth-guard";
import { EmergencyBanner } from "../emergency/emergency-banner";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcutsHandler } from "./keyboard-shortcuts";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-zinc-800 selection:text-zinc-100 transition-colors duration-200">
      <KeyboardShortcutsHandler />

      {/* Desktop Application Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Desktop TopBar with Spotlight Search */}
        <DesktopTopBar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Real-time Emergency Banner */}
        <EmergencyBanner />

        {/* Page Body with fluid Apple entry animation */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl w-full mx-auto pb-24 md:pb-12 animate-apple-in">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>

      {/* Spotlight Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShellContent>{children}</AppShellContent>
    </ProtectedRoute>
  );
}
