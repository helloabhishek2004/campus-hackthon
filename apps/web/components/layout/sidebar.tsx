"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Settings,
  User,
  LogOut,
  GraduationCap,
  BookOpen,
  CheckSquare,
  AlertCircle,
  PackageSearch,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { CampusGramLogo } from "./logo";
import { Avatar } from "../ui/avatar";
import { useCampusAuth } from "../auth/auth-guard";
import { useSidebar } from "./sidebar-context";
import { cn } from "@smart-campus/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  badge?: string;
  badgeColor?: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { name: "Feed", href: "/home", icon: Home, shortcut: "G H" },
  { name: "Documents", href: "/documents", icon: FileText, shortcut: "G D" },
];

const MODULE_NAV_ITEMS: NavItem[] = [
  {
    name: "Complaints & AI",
    href: "/complaints",
    icon: AlertCircle,
    shortcut: "G C",
    badge: "M2",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    name: "Lost & Found",
    href: "/lost-and-found",
    icon: PackageSearch,
    shortcut: "G L",
    badge: "M3",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    name: "Emergency Alerts",
    href: "/emergency",
    icon: ShieldAlert,
    shortcut: "G E",
    badge: "M4 SOS",
    badgeColor: "text-red-400 bg-red-500/10 border-red-500/20",
  },
];

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { name: "Profile", href: "/profile", icon: User, shortcut: "G P" },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "G S" },
];

const FACULTY_NAV_ITEMS: NavItem[] = [
  { name: "Faculty Portal", href: "/faculty", icon: GraduationCap, shortcut: "G F" },
  { name: "Academic Notices", href: "/faculty/documents", icon: BookOpen, shortcut: "G N" },
  { name: "Submissions", href: "/faculty/submissions", icon: CheckSquare, shortcut: "G A" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useCampusAuth();
  const { isCollapsed, toggleSidebar, toggleCommandPalette } = useSidebar();

  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl h-screen sticky top-0 justify-between select-none shrink-0 overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30",
        isCollapsed ? "w-16 p-2.5 items-center" : "w-64 p-3.5"
      )}
      aria-label="Application Sidebar"
    >
      <div className={cn("w-full space-y-4", isCollapsed && "flex flex-col items-center")}>
        {/* Sidebar Header & Collapse Toggle */}
        <div
          className={cn(
            "flex items-center pt-0.5",
            isCollapsed ? "justify-center w-full" : "justify-between px-1"
          )}
        >
          {!isCollapsed ? (
            <>
              <CampusGramLogo size="md" withLink />
              <button
                onClick={toggleSidebar}
                className="apple-press p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
                title="Collapse sidebar (⌘B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="apple-press p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
              title="Expand sidebar (⌘B)"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Spotlight Search Trigger */}
        <div className="w-full">
          {!isCollapsed ? (
            <button
              onClick={toggleCommandPalette}
              className="apple-press w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-normal shadow-xs group"
              title="Search campus modules and actions"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-300" />
                <span className="text-zinc-400 group-hover:text-zinc-300 text-[11px]">
                  Spotlight Search...
                </span>
              </div>
              <span className="apple-kbd">⌘K</span>
            </button>
          ) : (
            <button
              onClick={toggleCommandPalette}
              className="apple-press w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all shadow-xs"
              title="Spotlight Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Navigation List */}
        <nav className="w-full space-y-1" aria-label="Main Navigation">
          {/* Section: Campus Life */}
          {!isCollapsed && (
            <div className="px-2 pt-1 pb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Campus Life
              </span>
            </div>
          )}

          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? `${item.name} (${item.shortcut})` : undefined}
                className={cn(
                  "apple-press flex items-center rounded-lg text-xs font-medium transition-all group",
                  isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && (
                  <span className="apple-kbd opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.shortcut}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Section: Campus Systems (Modules 2, 3, 4) */}
          {!isCollapsed ? (
            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Campus Systems
              </span>
            </div>
          ) : (
            <div className="w-8 h-px bg-zinc-800/80 my-2 mx-auto" />
          )}

          {MODULE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? `${item.name} (${item.shortcut})` : undefined}
                className={cn(
                  "apple-press flex items-center rounded-lg text-xs font-medium transition-all group",
                  isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold tracking-wide",
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span className="apple-kbd opacity-60 group-hover:opacity-100 transition-opacity">
                      {item.shortcut}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}

          {/* Section: Faculty & Academic Portal */}
          {isFacultyOrAdmin && (
            <>
              {!isCollapsed ? (
                <div className="pt-3 pb-1 px-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                    Faculty & Academic
                  </span>
                </div>
              ) : (
                <div className="w-8 h-px bg-zinc-800/80 my-2 mx-auto" />
              )}

              {FACULTY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? `${item.name} (${item.shortcut})` : undefined}
                    className={cn(
                      "apple-press flex items-center rounded-lg text-xs font-medium transition-all group",
                      isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                      isActive
                        ? "bg-zinc-900 text-zinc-100 border border-zinc-800/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && (
                      <span className="apple-kbd opacity-60 group-hover:opacity-100 transition-opacity">
                        {item.shortcut}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {/* Section: Account & Settings */}
          {!isCollapsed ? (
            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Account
              </span>
            </div>
          ) : (
            <div className="w-8 h-px bg-zinc-800/80 my-2 mx-auto" />
          )}

          {ACCOUNT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? `${item.name} (${item.shortcut})` : undefined}
                className={cn(
                  "apple-press flex items-center rounded-lg text-xs font-medium transition-all group",
                  isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && (
                  <span className="apple-kbd opacity-60 group-hover:opacity-100 transition-opacity">
                    {item.shortcut}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      {user && (
        <div className={cn("w-full pt-3 border-t border-zinc-800/80 space-y-2", isCollapsed && "items-center flex flex-col")}>
          <Link
            href="/profile"
            title={isCollapsed ? `${user.fullName} (${user.institutionalId})` : undefined}
            className={cn(
              "apple-press flex items-center rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800/80 transition-colors group",
              isCollapsed ? "p-1 justify-center" : "gap-2.5 p-2"
            )}
          >
            <Avatar name={user.fullName} role={user.role} size="sm" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-zinc-100">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">
                  {user.institutionalId}
                </p>
              </div>
            )}
          </Link>

          {!isCollapsed ? (
            <button
              onClick={logout}
              className="apple-press w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
              title="Sign out of CampusGram session"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={logout}
              className="apple-press w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
