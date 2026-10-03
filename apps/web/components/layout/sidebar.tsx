"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, User, LogOut, GraduationCap, BookOpen, CheckSquare } from "lucide-react";
import { CampusGramLogo } from "./logo";
import { Avatar } from "../ui/avatar";
import { useCampusAuth } from "../auth/auth-guard";
import { cn } from "@smart-campus/utils";

const NAV_ITEMS = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
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
    <aside className="hidden md:flex flex-col w-56 lg:w-60 border-r border-zinc-800 bg-zinc-950 h-screen sticky top-0 p-4 justify-between select-none shrink-0">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="px-2 pt-1">
          <CampusGramLogo size="md" withLink />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Main Navigation">
          <div className="px-2 pb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
              Navigation
            </span>
          </div>

          {NAV_ITEMS.map((item) => {
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

          {/* Faculty Portal Links for Authorized Staff */}
          {isFacultyOrAdmin && (
            <div className="pt-4 space-y-1">
              <div className="px-2 pb-1.5">
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
