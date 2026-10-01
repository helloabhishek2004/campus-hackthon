import React from "react";
import { cn } from "@smart-campus/utils";

interface AvatarProps {
  name: string;
  role?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, role, size = "md", className }: AvatarProps) {
  // Extract initials
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CG";

  // Deterministic color palette based on name hash
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    { bg: "from-blue-600 to-indigo-700", ring: "ring-blue-500/30", text: "text-white" },
    { bg: "from-emerald-600 to-teal-700", ring: "ring-emerald-500/30", text: "text-white" },
    { bg: "from-purple-600 to-indigo-800", ring: "ring-purple-500/30", text: "text-white" },
    { bg: "from-amber-600 to-orange-700", ring: "ring-amber-500/30", text: "text-white" },
    { bg: "from-rose-600 to-pink-700", ring: "ring-rose-500/30", text: "text-white" },
    { bg: "from-cyan-600 to-blue-700", ring: "ring-cyan-500/30", text: "text-white" },
  ];
  const palette = palettes[hash % palettes.length];

  const sizeClasses = {
    sm: "w-8 h-8 text-xs ring-1",
    md: "w-10 h-10 text-sm ring-2",
    lg: "w-16 h-16 text-xl ring-2",
    xl: "w-24 h-24 text-3xl ring-4 font-bold",
  }[size];

  return (
    <div
      className={cn(
        "relative rounded-full inline-flex items-center justify-center font-semibold bg-gradient-to-br shadow-inner select-none transition-transform",
        palette.bg,
        palette.ring,
        palette.text,
        sizeClasses,
        className
      )}
      aria-label={`${name}'s avatar (${role || "User"})`}
    >
      <span>{initials}</span>
      {role === "faculty" && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-indigo-500 border-2 border-zinc-950 rounded-full"
          title="Faculty"
        />
      )}
      {role === "student" && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"
          title="Student"
        />
      )}
    </div>
  );
}
