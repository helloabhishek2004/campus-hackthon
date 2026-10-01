"use client";

import React from "react";
import { AcademicDocument } from "@smart-campus/contracts";
import {
  FileText,
  Calendar,
  Paperclip,
  CheckCheck,
  Clock,
  User,
  AlertTriangle,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface AcademicDocCardProps {
  document: AcademicDocument;
  viewMode: "received" | "sent";
  onSelect: (doc: AcademicDocument) => void;
  onMarkRead?: (doc: AcademicDocument) => void;
}

export function AcademicDocCard({
  document,
  viewMode,
  onSelect,
  onMarkRead,
}: AcademicDocCardProps) {
  const isUnread = viewMode === "received" && document.isRead === false;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  const readPercentage =
    document.deliveryCount && document.deliveryCount > 0
      ? Math.round((document.readCount / document.deliveryCount) * 100)
      : 0;

  return (
    <div
      onClick={() => onSelect(document)}
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-200 cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:shadow-lg hover:shadow-black/40",
        isUnread && "border-blue-500/30 bg-blue-950/10 shadow-sm shadow-blue-950/20"
      )}
    >
      {/* Top Header: Category, Priority, Unread Dot */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700/60 flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-neutral-400" />
              {document.documentType}
            </span>

            {document.priority !== "normal" && (
              <span
                className={cn(
                  "px-2 py-0.5 text-[11px] font-semibold rounded-full border uppercase tracking-wider",
                  getPriorityStyle(document.priority)
                )}
              >
                {document.priority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isUnread && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Unread
              </span>
            )}
            <span className="text-xs text-neutral-500">
              {formatDate(document.createdAt)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-base font-semibold leading-snug tracking-tight mb-2 text-neutral-200 group-hover:text-white transition-colors line-clamp-2",
            isUnread && "text-white font-bold"
          )}
        >
          {document.title}
        </h3>

        {/* Excerpt / Summary */}
        <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
          {document.content}
        </p>
      </div>

      {/* Target Scope or Sender Context */}
      <div className="pt-3 border-t border-neutral-800/80 mt-auto">
        <div className="flex items-center justify-between gap-3 text-xs">
          {viewMode === "received" ? (
            <div className="flex items-center gap-2 text-neutral-300 min-w-0">
              <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-semibold text-neutral-300 shrink-0">
                {document.senderName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="font-medium text-neutral-200 truncate leading-none">
                  {document.senderName}
                </p>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                  {document.senderRole} {document.senderDepartment ? `· ${document.senderDepartment}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-400 min-w-0">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/50 truncate">
                To: {document.targetDisplayName || document.targetScope}
              </span>
            </div>
          )}

          {/* Delivery & Read Metrics for Sent Documents */}
          {viewMode === "sent" && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-neutral-300">
                  {document.readCount} / {document.deliveryCount}
                </span>
                <span className="text-[10px] text-neutral-500 ml-1">read ({readPercentage}%)</span>
              </div>
              <div className="w-14 h-1.5 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/50">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${readPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Action / Badges for Received Documents */}
          {viewMode === "received" && (
            <div className="flex items-center gap-2 shrink-0">
              {document.deadline && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/90 bg-amber-950/20 border border-amber-800/30 px-2 py-0.5 rounded">
                  <Calendar className="w-3 h-3" />
                  Due {formatDate(document.deadline)}
                </span>
              )}

              {document.attachments && document.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">
                  <Paperclip className="w-3 h-3" />
                  {document.attachments.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
