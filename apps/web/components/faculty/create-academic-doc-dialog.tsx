"use client";

import React, { useState, useEffect } from "react";
import {
  AcademicDocument,
  AcademicDocumentType,
  AcademicDocumentPriority,
  FacultyAuthorizedScopeItem,
  CreateAcademicDocumentRequest,
} from "@smart-campus/contracts";
import { facultyAcademicClientService } from "@/lib/services/faculty-academic-client-service";
import {
  X,
  Send,
  Loader2,
  Paperclip,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

const DOCUMENT_TYPES: AcademicDocumentType[] = [
  "Academic Notice",
  "Assignment",
  "Assessment Notice",
  "Exam Schedule",
  "Class Schedule",
  "Course Material",
  "Syllabus / Curriculum",
  "Workshop / Seminar Notice",
  "Attendance Notice",
  "Academic Circular",
  "Department Notice",
  "Course Announcement",
  "Meeting Notice",
  "Academic Reminder",
  "Other Academic Document",
];

const PRIORITIES: Array<{ value: AcademicDocumentPriority; label: string }> = [
  { value: "low", label: "Low Priority" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent" },
];

interface CreateAcademicDocDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: AcademicDocument) => void;
}

export function CreateAcademicDocDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateAcademicDocDialogProps) {
  const [scopes, setScopes] = useState<FacultyAuthorizedScopeItem[]>([]);
  const [loadingScopes, setLoadingScopes] = useState(true);

  const [selectedScopeId, setSelectedScopeId] = useState<string>("");
  const [documentType, setDocumentType] = useState<AcademicDocumentType>("Academic Notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AcademicDocumentPriority>("normal");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadScopes = async () => {
      setLoadingScopes(true);
      setError(null);
      try {
        const items = await facultyAcademicClientService.getAuthorizedScopes();
        setScopes(items);
        if (items.length > 0 && !selectedScopeId) {
          setSelectedScopeId(items[0].id);
        }
      } catch {
        setError("Failed to load authorized academic scopes.");
      } finally {
        setLoadingScopes(false);
      }
    };

    loadScopes();
  }, [isOpen, selectedScopeId]);

  if (!isOpen) return null;

  const selectedScope = scopes.find((s) => s.id === selectedScopeId) || scopes[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScope) {
      setError("Please select an authorized academic scope.");
      return;
    }

    if (!title.trim() || title.length < 3) {
      setError("Title must be at least 3 characters long.");
      return;
    }

    if (!content.trim() || content.length < 10) {
      setError("Content must be at least 10 characters long.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const request: CreateAcademicDocumentRequest = {
      title: title.trim(),
      content: content.trim(),
      documentType,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      targetScope: selectedScope.scope,
      targetDepartmentCode: selectedScope.departmentCode,
      targetDepartmentId: selectedScope.departmentId,
      targetProgramCode: selectedScope.programCode,
      targetProgramId: selectedScope.programId,
      targetAcademicYear: selectedScope.academicYear,
      targetSemester: selectedScope.semester,
      targetSection: selectedScope.section,
      targetCourseId: selectedScope.courseId,
      targetCourseName: selectedScope.courseName,
    };

    try {
      const res = await facultyAcademicClientService.createDocument(request, file);
      if (res.success && res.document) {
        onSuccess(res.document);
        onClose();
      } else {
        setError(res.error || "Failed to publish academic document.");
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error publishing document.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Compose Academic Document
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Publish formal notices, assignments, and circulars within your authorized academic scope.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg border border-red-900/60 bg-red-950/40 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Academic Scope Selection (Server-authorized only) */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-200 block">
              Academic Scope & Target Recipients
            </label>
            {loadingScopes ? (
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Validating your institutional authority...</span>
              </div>
            ) : scopes.length === 0 ? (
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400">
                You do not currently hold any active academic assignments or coordination responsibilities.
              </div>
            ) : (
              <select
                value={selectedScopeId}
                onChange={(e) => setSelectedScopeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                {scopes.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.displayName}
                  </option>
                ))}
              </select>
            )}
            {selectedScope && (
              <p className="text-[11px] text-zinc-500 font-mono">
                {selectedScope.description} Estimated delivery: {selectedScope.estimatedRecipients} recipients.
              </p>
            )}
          </div>

          {/* Document Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-zinc-200 block">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as AcademicDocumentType)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-zinc-200 block">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AcademicDocumentPriority)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-200 block">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Term Assessment Schedule & Exam Hall Instructions"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              required
            />
          </div>

          {/* Content / Formal Body */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-200 block">
              Formal Academic Content
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete, structured information regarding rubrics, venues, instructions, or course announcements..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none font-sans"
              required
            />
          </div>

          {/* Optional Deadline (for assignments/submission deadlines) */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Optional Submission / Due Date</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Optional Attachment */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-200 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
              <span>Attachment (PDF, DOCX, ZIP up to 10MB)</span>
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || scopes.length === 0}
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
