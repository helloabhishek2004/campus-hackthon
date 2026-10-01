import React from "react";
import { CampusDocument } from "../../lib/services/documents-data";
import { Badge } from "@smart-campus/ui";
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

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 shadow-lg hover:shadow-xl",
        className
      )}
    >
      <div>
        {/* Top Icon & Status Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:border-blue-500/40 transition-colors shadow-inner">
            <Icon className="w-5 h-5" />
          </div>

          <Badge
            variant={document.statusVariant === "success" ? "success" : "secondary"}
            className="text-[11px] capitalize tracking-wide font-medium"
          >
            {document.status}
          </Badge>
        </div>

        {/* Title & Category */}
        <h4 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors leading-snug">
          {document.title}
        </h4>
        <p className="text-xs text-zinc-500 capitalize mt-0.5 tracking-wide">
          {document.category} Document
        </p>

        {/* Short Description */}
        <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
          {document.description}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="text-[11px] font-mono text-zinc-500">
          {document.issuedDate}
        </span>

        <button
          onClick={() => onView && onView(document)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors hover:underline underline-offset-4 focus:outline-none"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
