import React from "react";
import { cn } from "@smart-campus/utils";

interface AvatarProps {
  name: string;
  role?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, role, size = "md", className }: AvatarProps) {
  // Extract clean initials
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CG";

  const sizeClasses = {
    sm: "w-7 h-7 text-[11px] rounded-md",
    md: "w-8 h-8 text-xs rounded-lg",
    lg: "w-12 h-12 text-base rounded-xl",
    xl: "w-16 h-16 text-xl rounded-2xl",
  }[size];

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-200 select-none shrink-0 transition-colors",
        sizeClasses,
        className
      )}
      aria-label={`${name}'s avatar (${role || "User"})`}
    >
      <span>{initials}</span>
      {role === "faculty" && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-zinc-400 border border-zinc-950"
          title="Faculty member"
        />
      )}
      {role === "student" && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500/80 border border-zinc-950"
          title="Enrolled student"
        />
      )}
    </div>
  );
}
