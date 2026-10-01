import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@smart-campus/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
}

export function CampusGramLogo({ className, size = "md", withLink = false }: LogoProps) {
  const sizeStyles = {
    sm: { icon: "w-6 h-6 text-xs", text: "text-base", sub: "text-[10px]" },
    md: { icon: "w-8 h-8 text-sm", text: "text-lg", sub: "text-xs" },
    lg: { icon: "w-11 h-11 text-base", text: "text-2xl", sub: "text-xs" },
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <div
        className={cn(
          "rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-400 p-[1px] shadow-lg shadow-indigo-950/50 group-hover:shadow-indigo-500/20 transition-all duration-300"
        )}
      >
        <div
          className={cn(
            "rounded-[11px] bg-zinc-950 flex items-center justify-center font-black tracking-tighter text-white",
            sizeStyles.icon
          )}
        >
          <span className="bg-gradient-to-r from-blue-400 to-emerald-300 bg-clip-text text-transparent">
            CG
          </span>
        </div>
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-extrabold tracking-tight text-zinc-100 flex items-center gap-1 group-hover:text-white transition-colors",
            sizeStyles.text
          )}
        >
          CampusGram
        </span>
        <span className={cn("text-zinc-500 font-medium tracking-wide uppercase", sizeStyles.sub)}>
          Smart Campus
        </span>
      </div>
    </div>
  );

  if (withLink) {
    return (
      <Link href="/home" className="focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
