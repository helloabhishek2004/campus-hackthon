"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  AlertCircle,
  PackageSearch,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";
import { CampusGramLogo } from "./logo";
import { Avatar } from "../ui/avatar";
import { useCampusAuth } from "../auth/auth-guard";
import { cn } from "@smart-campus/utils";

const MOBILE_NAV_ITEMS = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Docs", href: "/documents", icon: FileText },
  { name: "Complaints", href: "/complaints", icon: AlertCircle },
  { name: "Lost&Found", href: "/lost-and-found", icon: PackageSearch },
  { name: "Emergency", href: "/emergency", icon: ShieldAlert },
];

export function MobileHeader() {
  const { user } = useCampusAuth();

  return (
    <header className="md:hidden flex min-h-14 items-center justify-between px-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-40">
      <CampusGramLogo size="sm" withLink />
      {user && (
        <Link
          href="/profile"
          className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
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

  const navItems = isFacultyOrAdmin
    ? [
        { name: "Home", href: "/home", icon: Home },
        { name: "Faculty", href: "/faculty", icon: GraduationCap },
        { name: "Complaints", href: "/complaints", icon: AlertCircle },
        { name: "Lost&Found", href: "/lost-and-found", icon: PackageSearch },
        { name: "Emergency", href: "/emergency", icon: ShieldAlert },
      ]
    : MOBILE_NAV_ITEMS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around"
      aria-label="Mobile Navigation Bar"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const isEmergency = item.href === "/emergency";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "apple-press flex min-h-11 flex-1 max-w-24 flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-lg text-[9px] font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              isActive
                ? isEmergency
                  ? "text-red-500 font-bold"
                  : "text-foreground font-bold"
                : isEmergency
                ? "text-red-500/80 hover:text-red-600 dark:hover:text-red-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 mb-1 transition-colors",
                isActive
                  ? isEmergency
                    ? "text-red-500"
                    : "text-foreground"
                  : isEmergency
                  ? "text-red-500/80"
                  : "text-muted-foreground"
              )}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
