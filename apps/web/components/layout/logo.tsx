import React from "react";
import Link from "next/link";
import { cn } from "@smart-campus/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
}

export function CampusGramLogo({ className, size = "md", withLink = false }: LogoProps) {
  const sizeStyles = {
    sm: { box: "w-6 h-6 text-[10px] rounded-md", text: "text-sm", sub: "text-[9px]" },
    md: { box: "w-7 h-7 text-xs rounded-md", text: "text-sm", sub: "text-[10px]" },
    lg: { box: "w-9 h-9 text-sm rounded-lg", text: "text-base", sub: "text-xs" },
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className={cn(
          "bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-200 shadow-sm",
          sizeStyles.box
        )}
      >
        <span>CG</span>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-semibold tracking-tight text-zinc-100",
            sizeStyles.text
          )}
        >
          CampusGram
        </span>
        <span
          className={cn(
            "text-zinc-500 font-mono tracking-wider uppercase mt-0.5",
            sizeStyles.sub
          )}
        >
          Smart Campus
        </span>
      </div>
    </div>
  );

  if (withLink) {
    return (
      <Link
        href="/home"
        className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-md"
      >
        {content}
      </Link>
    );
  }

  return content;
}
