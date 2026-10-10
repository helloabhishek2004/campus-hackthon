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
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-background text-foreground antialiased selection:bg-muted selection:text-foreground flex flex-col md:flex-row">
      <KeyboardShortcutsHandler />

      {/* Accessible skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring text-xs font-semibold"
      >
        Skip to main content
      </a>

      {/* Desktop Application Sidebar - Fixed in Screen Height */}
      <Sidebar />

      {/* Main Content Area - Dedicated Viewport & Scroll Container */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {/* Desktop TopBar with Spotlight Search */}
        <DesktopTopBar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Real-time Emergency Banner */}
        <EmergencyBanner />

        {/* Page Body - Dedicated Scrollable Viewport */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar focus:outline-none"
        >
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 animate-apple-in">
            {children}
          </div>
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
