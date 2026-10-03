import React from "react";
import { CampusDocument } from "../../lib/services/documents-data";
import {
  IdCard,
  Award,
  FileText,
  CalendarCheck,
  BookOpen,
  ShieldCheck,
  Bus,
  Home,
  Users,
  Activity,
  Key,
  ArrowRight,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface DocumentCardProps {
  document: CampusDocument;
  onView?: (document: CampusDocument) => void;
  className?: string;
}

export function DocumentCard({ document, onView, className }: DocumentCardProps) {
  const getIcon = () => {
    switch (document.iconName) {
      case "id-card":
        return IdCard;
      case "award":
        return Award;
      case "file-text":
        return FileText;
      case "calendar-check":
        return CalendarCheck;
      case "book-open":
        return BookOpen;
      case "shield-check":
        return ShieldCheck;
      case "bus":
        return Bus;
      case "home":
        return Home;
      case "users":
        return Users;
      case "activity":
        return Activity;
      case "key":
        return Key;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  const getStatusBadge = () => {
    if (document.status === "Active" || document.status === "Verified" || document.status === "Approved") {
      return "bg-emerald-950/50 text-emerald-400 border-emerald-900/60";
    }
    return "bg-zinc-800 text-zinc-300 border-zinc-700/80";
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all select-none shadow-sm",
        className
      )}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-zinc-100 transition-colors shrink-0">
            <Icon className="w-4 h-4" />
          </div>

          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded border tracking-wide uppercase font-medium",
              getStatusBadge()
            )}
          >
            {document.status}
          </span>
        </div>

        {/* Title & Category */}
        <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug">
          {document.title}
        </h4>
        <p className="text-[11px] text-zinc-500 capitalize mt-0.5 tracking-wide">
          {document.category}
        </p>

        {/* Description */}
        <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
          {document.description}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between">
        <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[140px]">
          {document.documentNumber}
        </span>

        <button
          type="button"
          onClick={() => onView && onView(document)}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors group-hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded px-1 py-0.5"
          aria-label={`View details for ${document.title}`}
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
