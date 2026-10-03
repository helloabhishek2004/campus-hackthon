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
  Sun,
  Moon,
} from "lucide-react";
import { Avatar } from "../ui/avatar";
import { useCampusAuth } from "../auth/auth-guard";
import { useSidebar } from "./sidebar-context";
import { useTheme } from "../theme/theme-context";
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
    badgeColor: "text-zinc-600 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700",
  },
  {
    name: "Lost & Found",
    href: "/lost-and-found",
    icon: PackageSearch,
    shortcut: "G L",
    badge: "M3",
    badgeColor: "text-zinc-600 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700",
  },
  {
    name: "Emergency Alerts",
    href: "/emergency",
    icon: ShieldAlert,
    shortcut: "G E",
    badge: "M4 SOS",
    badgeColor: "text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
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
  const { theme, toggleTheme } = useTheme();

  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed inset-y-0 left-0 border-r border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl h-screen h-dvh justify-between select-none shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30",
        isCollapsed ? "w-16 p-2.5 items-center" : "w-64 p-3.5"
      )}
      aria-label="Application Sidebar"
    >
      <div className={cn("w-full space-y-2", isCollapsed && "flex flex-col items-center")}>
        {/* Sidebar Header: Single CampusGram Logo that morphs into collapse/expand switch on hover */}
        <div className="w-full flex items-center justify-start pt-0.5">
          <button
            onClick={toggleSidebar}
            className={cn(
              "apple-press group relative flex min-h-11 items-center rounded-xl p-1.5 transition-all text-left border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
              isCollapsed ? "justify-center w-full mx-auto" : "w-full gap-2.5"
            )}
            title={isCollapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Logo Mark with Hover Switch Transformation */}
            <div className="relative w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-900 border border-zinc-700/80 dark:border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-100 shadow-sm shrink-0 overflow-hidden group-hover:border-zinc-500 dark:group-hover:border-zinc-600 transition-colors">
              {/* Normal State: CampusGram Mark */}
              <span className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-50">
                CG
              </span>

              {/* Hovered State: macOS Switch */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 text-zinc-100">
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-none min-w-0 pr-1">
                <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                  CampusGram
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
                  Smart Campus
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Global Spotlight Search Trigger */}
        <div className="w-full">
          {!isCollapsed ? (
            <button
              onClick={toggleCommandPalette}
               className="apple-press w-full min-h-9 flex items-center justify-between px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900/70 hover:bg-zinc-200/80 dark:hover:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all text-xs font-normal shadow-xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              title="Search campus modules and actions"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 text-[11px]">
                  Spotlight Search...
                </span>
              </div>
              <span className="apple-kbd">⌘K</span>
            </button>
          ) : (
            <button
              onClick={toggleCommandPalette}
               className="apple-press w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900/60 hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-zinc-300 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              title="Spotlight Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Navigation List */}
        <nav className="w-full space-y-0.5" aria-label="Main Navigation">
          {/* Section: Campus Life */}
          {!isCollapsed && (
            <div className="px-2 pt-1 pb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
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
                  "apple-press flex min-h-9 items-center rounded-lg text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1",
                  isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-800/90 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300"
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
             <div className="pt-1.5 pb-0.5 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
                Campus Systems
              </span>
            </div>
          ) : (
            <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800/80 my-1 mx-auto" />
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
                  "apple-press flex min-h-9 items-center rounded-lg text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1",
                  isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-800/90 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold tracking-wide",
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
                 <div className="pt-1.5 pb-0.5 px-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
                    Faculty & Academic
                  </span>
                </div>
              ) : (
                <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800/80 my-1 mx-auto" />
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
                      "apple-press flex min-h-9 items-center rounded-lg text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1",
                      isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-800/90 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300"
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
             <div className="pt-1.5 pb-0.5 px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
                Account
              </span>
            </div>
          ) : (
            <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800/80 my-1 mx-auto" />
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
                  "apple-press flex min-h-9 items-center rounded-lg text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1",
                  isCollapsed ? "justify-center p-2.5 w-10 h-10 mx-auto" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-800/90 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300"
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

      {/* Sidebar Footer: Theme Switch & User Session */}
      <div className={cn("w-full pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5", isCollapsed && "items-center flex flex-col")}>
        {/* Theme Toggle Button (Light / Dark) */}
        <div className="w-full">
          {!isCollapsed ? (
            <button
              onClick={toggleTheme}
               className="apple-press w-full min-h-9 flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600" />
                )}
                <span>{theme === "dark" ? "Light Theme" : "Dark Theme"}</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {theme}
              </span>
            </button>
          ) : (
            <button
              onClick={toggleTheme}
               className="apple-press w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-zinc-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>
          )}
        </div>

        {/* User Session Profile & Sign Out */}
        {user && (
          <>
            <Link
              href="/profile"
              title={isCollapsed ? `${user.fullName} (${user.institutionalId})` : undefined}
              className={cn(
                "apple-press flex min-h-10 items-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800/80 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                isCollapsed ? "p-1 justify-center" : "gap-2.5 p-2"
              )}
            >
              <Avatar name={user.fullName} role={user.role} size="sm" />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-zinc-100">
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
                 className="apple-press w-full min-h-9 flex items-center justify-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                title="Sign out of CampusGram session"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={logout}
                 className="apple-press w-10 h-10 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
