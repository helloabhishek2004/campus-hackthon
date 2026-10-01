"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, User } from "lucide-react";
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
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <CampusGramLogo size="sm" withLink />
      {user && (
        <Link href="/profile" className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
          <Avatar name={user.fullName} role={user.role} size="sm" />
        </Link>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-lg px-2 py-2 flex items-center justify-around"
      aria-label="Mobile Bottom Navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-medium transition-all duration-200",
              isActive
                ? "text-blue-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "w-5 h-5 mb-0.5 transition-transform",
                  isActive && "scale-110 text-blue-400"
                )}
              />
              {isActive && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </div>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
