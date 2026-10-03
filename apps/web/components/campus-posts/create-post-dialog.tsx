"use client";

import React, { useState, useRef } from "react";
import {
  CampusPost,
  CampusPostCategory,
  CampusPostAudienceScope,
  CreateCampusPostRequest,
} from "@smart-campus/contracts";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { campusPostsClientService } from "@/lib/services/campus-posts-client-service";
import { resolveUserRoleCategory } from "@/lib/campus-posts/campus-post-permissions";
import {
  X,
  Send,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (post: CampusPost) => void;
}

export function CreatePostDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreatePostDialogProps) {
  const { user } = useCampusAuth();

  const roleCategory = resolveUserRoleCategory(
    user?.role || "student",
    user?.tags || []
  );

  const isRegularStudent = roleCategory === "regular_student";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // Regular student cannot publish academic; default to non-academic
  const [category, setCategory] = useState<CampusPostCategory>("non-academic");
  const [audienceScope, setAudienceScope] =
    useState<CampusPostAudienceScope>(isRegularStudent ? "students" : "campus");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setFileError("Invalid format. Allowed: PDF, PNG, JPG, WEBP.");
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFileError("File exceeds 10MB maximum limit.");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setGeneralError("Please enter both title and content.");
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    const postPayload: CreateCampusPostRequest = {
      title: title.trim(),
      content: content.trim(),
      category: isRegularStudent ? "non-academic" : category,
      audienceScope,
      departmentCode: user?.departmentCode || undefined,
      programCode: user?.programCode || undefined,
      academicYear: user?.academicYear || undefined,
      semester: user?.semester || undefined,
      section: user?.section || undefined,
    };

    const res = await campusPostsClientService.createPost(postPayload, file);
    setSubmitting(false);

    if (res.success && res.post) {
      onSuccess(res.post);
      onClose();
      // Reset
      setTitle("");
      setContent("");
      setFile(null);
    } else {
      setGeneralError(res.error || "Failed to publish campus post.");
    }
  };

  // Handle Escape key to close dialog
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-apple-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/80 dark:bg-zinc-950/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 id="create-post-title" className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Publish Campus Notice
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Targeted student activities, circulars, and announcements.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="apple-press p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="create-post-form" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {generalError && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2.5 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Post Title */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Notice Title</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Campus Hackathon 2026 - Registrations Live"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            />
          </div>

          {/* Category & Scope (Dual Grid on larger screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Selection */}
            <div className="space-y-1">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Category</label>
              {isRegularStudent ? (
                <div className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Non-Academic</span>
                  <span className="text-[10px] font-mono">Student</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategory("non-academic")}
                    className={cn(
                      "py-1.5 px-2 rounded-lg border text-center font-medium transition-colors text-[11px]",
                      category === "non-academic"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    Non-Academic
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("academic")}
                    className={cn(
                      "py-1.5 px-2 rounded-lg border text-center font-medium transition-colors text-[11px]",
                      category === "academic"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    Academic
                  </button>
                </div>
              )}
            </div>

            {/* Target Audience Scope */}
            <div className="space-y-1">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Audience Scope</label>
              <select
                value={audienceScope}
                onChange={(e) =>
                  setAudienceScope(e.target.value as CampusPostAudienceScope)
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
              >
                {isRegularStudent ? (
                  <>
                    <option value="students">All Students</option>
                    <option value="class">My Class Only</option>
                  </>
                ) : (
                  <>
                    <option value="campus">Entire Campus</option>
                    <option value="department">
                      My Dept ({user?.departmentCode || "CAMPUS"})
                    </option>
                    <option value="students">Student Community</option>
                    <option value="class">My Class Only</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Description & Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">
                Notice Content & Details
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {content.length}/5000
              </span>
            </div>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete event details, dates, venues, guidelines, or links..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Attachment Dropzone */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              Attach Circular / Poster (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-3 rounded-xl border border-dashed text-center cursor-pointer transition-colors space-y-1",
                file
                  ? "border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono text-xs truncate max-w-xs">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="text-xs">Click to attach PDF, PNG, JPG (&lt;10MB)</span>
                </div>
              )}
            </div>
            {fileError && (
              <p className="text-[11px] text-red-500 font-mono">{fileError}</p>
            )}
          </div>
        </form>

        {/* Fixed Sticky Footer (Always visible at 1st glance) */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="apple-press px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-200/70 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-post-form"
            disabled={submitting || !title.trim() || !content.trim()}
            className="apple-press px-4 py-1.5 rounded-lg text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Publish Notice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
