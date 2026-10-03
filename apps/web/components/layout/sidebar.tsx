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
} from "lucide-react";
import { CampusGramLogo } from "./logo";
import { Avatar } from "../ui/avatar";
import { useCampusAuth } from "../auth/auth-guard";
import { cn } from "@smart-campus/utils";

const MAIN_NAV_ITEMS = [
  { name: "Feed", href: "/home", icon: Home },
  { name: "Documents", href: "/documents", icon: FileText },
];

const MODULE_NAV_ITEMS = [
  {
    name: "Complaints & AI",
    href: "/complaints",
    icon: AlertCircle,
    badge: "M2",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    name: "Lost & Found",
    href: "/lost-and-found",
    icon: PackageSearch,
    badge: "M3",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    name: "Emergency Alerts",
    href: "/emergency",
    icon: ShieldAlert,
    badge: "M4 SOS",
    badgeColor: "text-red-400 bg-red-500/10 border-red-500/20",
  },
];

const ACCOUNT_NAV_ITEMS = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

const FACULTY_NAV_ITEMS = [
  { name: "Faculty Portal", href: "/faculty", icon: GraduationCap },
  { name: "Academic Notices", href: "/faculty/documents", icon: BookOpen },
  { name: "Submissions", href: "/faculty/submissions", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useCampusAuth();

  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-zinc-800 bg-zinc-950 h-screen sticky top-0 p-4 justify-between select-none shrink-0 overflow-y-auto">
      <div className="space-y-5">
        {/* Brand Logo */}
        <div className="px-2 pt-1">
          <CampusGramLogo size="md" withLink />
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1" aria-label="Main Navigation">
          <div className="px-2 pb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
              Campus Life
            </span>
          </div>

          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Connected Modules Section */}
          <div className="pt-3 pb-1 px-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
              Campus Systems
            </span>
          </div>

          {MODULE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm"
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
                  <span className="truncate">{item.name}</span>
                </div>
                <span
                  className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 font-semibold tracking-wide",
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}

          {/* Faculty Portal Links for Authorized Staff */}
          {isFacultyOrAdmin && (
            <div className="pt-3 space-y-1">
              <div className="px-2 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                  Faculty & Academic
                </span>
              </div>
              {FACULTY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group",
                      isActive
                        ? "bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Account & Settings */}
          <div className="pt-3 pb-1 px-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
              Account
            </span>
          </div>

          {ACCOUNT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      {user && (
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors group"
          >
            <Avatar name={user.fullName} role={user.role} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-zinc-100">
                {user.fullName}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                {user.institutionalId}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
            title="Sign out of CampusGram session"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
