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
        "relative inline-flex items-center justify-center font-mono font-medium bg-secondary border border-border text-foreground select-none shrink-0 transition-colors",
        sizeClasses,
        className
      )}
      aria-label={`${name}'s avatar (${role || "User"})`}
    >
      <span>{initials}</span>
      {role === "faculty" && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-muted-foreground border border-background"
          title="Faculty member"
        />
      )}
      {role === "student" && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-background"
          title="Enrolled student"
        />
      )}
    </div>
  );
}
