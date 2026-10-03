"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, User, GraduationCap } from "lucide-react";
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

export function MobileHeader() {
  const { user } = useCampusAuth();

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
      <CampusGramLogo size="sm" withLink />
      {user && (
        <Link
          href="/profile"
          className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-lg"
          aria-label="View Profile"
        >
          <Avatar name={user.fullName} role={user.role} size="sm" />
        </Link>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useCampusAuth();

  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  const items = isFacultyOrAdmin
    ? [
        { name: "Home", href: "/home", icon: Home },
        { name: "Faculty", href: "/faculty", icon: GraduationCap },
        { name: "Docs", href: "/documents", icon: FileText },
        { name: "Profile", href: "/profile", icon: User },
      ]
    : NAV_ITEMS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 px-3 py-1.5 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Navigation Bar"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors select-none",
              isActive
                ? "text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 mb-1 transition-colors",
                isActive ? "text-zinc-100" : "text-zinc-500"
              )}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
