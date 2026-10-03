"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Command,
  Sparkles,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { useCampusAuth } from "../auth/auth-guard";
import { Avatar } from "../ui/avatar";

export function DesktopTopBar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, toggleCommandPalette } = useSidebar();
  const { user } = useCampusAuth();

  // Compute clean breadcrumb title
  const getPageTitle = () => {
    if (pathname === "/home") return "Campus Life / Verified Feed";
    if (pathname === "/documents") return "Academic / Document Vault";
    if (pathname.startsWith("/complaints")) return "Campus Systems / Complaint Intelligence";
    if (pathname.startsWith("/lost-and-found")) return "Campus Systems / Lost & Found";
    if (pathname.startsWith("/emergency")) return "Life Safety / Emergency Alert Center";
    if (pathname.startsWith("/faculty")) return "Faculty & Administration / Academic Portal";
    if (pathname.startsWith("/profile")) return "Account / Institutional Profile";
    if (pathname.startsWith("/settings")) return "Account / Preferences";
    return "CampusGram Smart Campus";
  };

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-2.5 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-800/80 sticky top-0 z-20 select-none">
      {/* Left: Sidebar toggle + breadcrumb title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="apple-press p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800/80 transition-colors"
          title={isCollapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-zinc-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider truncate">
          {getPageTitle()}
        </span>
      </div>

      {/* Middle: Spotlight search pill */}
      <button
        onClick={toggleCommandPalette}
        className="apple-press flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-normal shadow-xs w-48 sm:w-60 lg:w-72 justify-between group shrink-0"
        title="Spotlight Search (⌘K / Ctrl+K)"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-300 shrink-0" />
          <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 truncate">
            Search campus, SOS...
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="apple-kbd">⌘K</span>
        </div>
      </button>

      {/* Right: Quick SOS trigger & profile avatar */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/emergency"
          className="apple-press flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-950/70 border border-red-800/50 hover:border-red-700 text-red-300 transition-all text-xs font-medium shadow-xs"
          title="Campus Life-Safety Emergency Center"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[11px] font-mono tracking-wider font-semibold">SOS</span>
        </Link>

        {user && (
          <Link
            href="/profile"
            className="apple-press p-1 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
            title={`${user.fullName} (${user.institutionalId})`}
          >
            <Avatar name={user.fullName} role={user.role} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}
