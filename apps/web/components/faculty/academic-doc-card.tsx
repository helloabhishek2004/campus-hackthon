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
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
      case "high":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-secondary text-secondary-foreground border-border";
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
        "group relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-200 cursor-pointer bg-card hover:bg-card/90 border-border hover:border-border/80 hover:shadow-md text-card-foreground",
        isUnread && "border-blue-500/40 bg-blue-500/5 shadow-xs"
      )}
    >
      {/* Top Header: Category, Priority, Unread Dot */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground border border-border flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-muted-foreground" />
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Unread
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(document.createdAt)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-base font-semibold leading-snug tracking-tight mb-2 text-foreground transition-colors line-clamp-2",
            isUnread && "font-bold text-foreground"
          )}
        >
          {document.title}
        </h3>

        {/* Excerpt / Summary */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {document.content}
        </p>
      </div>

      {/* Target Scope or Sender Context */}
      <div className="pt-3 border-t border-border/80 mt-auto">
        <div className="flex items-center justify-between gap-3 text-xs">
          {viewMode === "received" ? (
            <div className="flex items-center gap-2 text-foreground min-w-0">
              <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-semibold text-foreground shrink-0">
                {document.senderName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="font-medium text-foreground truncate leading-none">
                  {document.senderName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {document.senderRole} {document.senderDepartment ? `· ${document.senderDepartment}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground border border-border truncate">
                To: {document.targetDisplayName || document.targetScope}
              </span>
            </div>
          )}

          {/* Delivery & Read Metrics for Sent Documents */}
          {viewMode === "sent" && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-foreground">
                  {document.readCount} / {document.deliveryCount}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">read ({readPercentage}%)</span>
              </div>
              <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden border border-border">
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
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  <Calendar className="w-3 h-3" />
                  Due {formatDate(document.deadline)}
                </span>
              )}

              {document.attachments && document.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
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
