"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, User, LogOut } from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useCampusAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl h-screen sticky top-0 p-5 justify-between select-none">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="px-2 pt-1">
          <CampusGramLogo size="md" withLink />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      {user && (
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900 transition-colors group"
          >
            <Avatar name={user.fullName} role={user.role} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                {user.fullName}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                {user.institutionalId} • {user.role}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-zinc-800/60 hover:border-red-900/40 transition-colors"
            title="Sign out of CampusGram session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
