"use client";

import React, { useState } from "react";
import { AcademicDocument } from "@smart-campus/contracts";
import { facultyAcademicClientService } from "@/lib/services/faculty-academic-client-service";
import {
  X,
  FileText,
  Calendar,
  Paperclip,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  Eye,
  CheckCheck,
  Building2,
  Share2,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface AcademicDocDetailDialogProps {
  document: AcademicDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated?: (doc: AcademicDocument) => void;
  isSentView?: boolean;
}

export function AcademicDocDetailDialog({
  document,
  isOpen,
  onClose,
  onDocumentUpdated,
  isSentView = false,
}: AcademicDocDetailDialogProps) {
  const [markingRead, setMarkingRead] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !document) return null;

  const isUnread = !isSentView && document.isRead === false;

  const handleMarkAsRead = async () => {
    if (!document || markingRead) return;
    try {
      setMarkingRead(true);
      await facultyAcademicClientService.markAsRead(document.id);
      const updatedDoc = { ...document, isRead: true, readAt: new Date().toISOString() };
      if (onDocumentUpdated) {
        onDocumentUpdated(updatedDoc);
      }
    } catch (err) {
      console.error("Failed to mark document as read:", err);
    } finally {
      setMarkingRead(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case "high":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-neutral-800 text-neutral-400 border-neutral-700";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              {document.documentType}
            </span>

            <span
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold rounded-full border uppercase tracking-wider",
                getPriorityBadge(document.priority)
              )}
            >
              {document.priority} Priority
            </span>

            {isUnread && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Unread Notice
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Title */}
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
              {document.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                Published {formatDate(document.createdAt)}
              </span>
              <span>·</span>
              <span className="text-neutral-300 font-medium">
                Scope: {document.targetDisplayName || document.targetScope}
              </span>
            </div>
          </div>

          {/* Sender & Target Information Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs">
            <div>
              <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                Issuing Authority
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-semibold text-neutral-200">
                  {document.senderName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-neutral-200">{document.senderName}</p>
                  <p className="text-neutral-400">
                    {document.senderRole} {document.senderDepartment ? `(${document.senderDepartment})` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                Target Recipient Group
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-neutral-400" />
                <p className="font-medium text-neutral-200">
                  {document.targetDisplayName || document.targetScope}
                </p>
              </div>
              {isSentView && (
                <p className="text-[11px] text-neutral-400 mt-1">
                  Delivered to {document.deliveryCount} enrolled academic members
                </p>
              )}
            </div>
          </div>

          {/* Deadline Alert (if any) */}
          {document.deadline && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Submission / Action Deadline:{" "}
                <strong className="text-amber-200 font-semibold">{formatDate(document.deadline)}</strong>
              </span>
            </div>
          )}

          {/* Delivery & Read Statistics (for Sender View) */}
          {isSentView && (
            <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-300">Recipient Read Confirmation</span>
                <span className="font-semibold text-emerald-400">
                  {document.readCount} of {document.deliveryCount} verified ({Math.round((document.readCount / (document.deliveryCount || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.round((document.readCount / (document.deliveryCount || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-neutral-500">
                Audited timestamp confirmation is logged when recipients open this academic notice.
              </p>
            </div>
          )}

          {/* Document Content Body */}
          <div className="space-y-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
              Official Communication
            </span>
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {document.content}
            </div>
          </div>

          {/* Attachments Section */}
          {document.attachments && document.attachments.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
                Attached Documents ({document.attachments.length})
              </span>
              <div className="grid grid-cols-1 gap-2">
                {document.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded bg-neutral-800 text-neutral-300">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-neutral-200 truncate">
                          {att.originalFilename}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : "Document"}
                        </p>
                      </div>
                    </div>

                    <a
                      href={att.storagePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/40">
          <div className="text-xs text-neutral-500">
            Reference ID: <span className="font-mono text-[11px] text-neutral-400">{document.id}</span>
          </div>

          <div className="flex items-center gap-3">
            {isUnread && (
              <button
                onClick={handleMarkAsRead}
                disabled={markingRead}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {markingRead ? "Marking..." : "Mark as Read"}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
