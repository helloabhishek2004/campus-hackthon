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
import { cn } from "@smart-campus/utils";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isCommandPaletteOpen, setCommandPaletteOpen } = useSidebar();

  return (
    <div className="min-h-screen min-h-[100svh] overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-zinc-800 selection:text-zinc-100 transition-colors duration-200">
      <KeyboardShortcutsHandler />

      {/* Desktop Application Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-300",
          isCollapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        {/* Desktop TopBar with Spotlight Search */}
        <DesktopTopBar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Real-time Emergency Banner */}
        <EmergencyBanner />

        {/* Page Body with fluid Apple entry animation */}
        <main className="flex-1 w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 animate-apple-in">
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
