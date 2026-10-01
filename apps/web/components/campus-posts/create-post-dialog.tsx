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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 id="create-post-title" className="text-base font-semibold text-zinc-100">
              Publish Campus Information
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Share student activities, club updates, or notices with targeted campus audiences.
            </p>
          </div>
        </div>

        {generalError && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Post Title */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Title</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Campus Hackathon 2026 - Registrations Live"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            />
          </div>

          {/* Category Selection (Role-Aware) */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Category</label>
            {isRegularStudent ? (
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-zinc-200">Non-Academic</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Academic notices restricted to Coordinators
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("non-academic")}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-center font-medium transition-colors",
                    category === "non-academic"
                      ? "bg-zinc-800 border-zinc-600 text-white"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Non-Academic
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("academic")}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-center font-medium transition-colors",
                    category === "academic"
                      ? "bg-zinc-800 border-zinc-600 text-white"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Academic
                </button>
              </div>
            )}
          </div>

          {/* Audience Scope Selection (Role-Aware) */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Target Audience</label>
            <select
              value={audienceScope}
              onChange={(e) =>
                setAudienceScope(e.target.value as CampusPostAudienceScope)
              }
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
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
                    My Department ({user?.departmentCode || "CSE"})
                  </option>
                  <option value="students">Student Community</option>
                  <option value="class">My Class Only</option>
                </>
              )}
            </select>
          </div>

          {/* Post Description / Content */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">
              Content & Details
            </label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete event details, dates, venues, guidelines, or links..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none leading-relaxed"
            />
            <div className="flex justify-end text-[10px] text-zinc-500 font-mono">
              {content.length}/5000
            </div>
          </div>

          {/* Optional Attachment Dropzone */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">
              Attach Circular / Poster (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-3.5 rounded-xl border border-dashed text-center cursor-pointer transition-colors space-y-1",
                file
                  ? "border-emerald-800/80 bg-emerald-950/20"
                  : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600"
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
                <div className="flex items-center justify-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-4 h-4 text-zinc-500 mx-auto" />
                  <p className="text-zinc-300 font-medium">Click to attach file</p>
                  <p className="text-[10px] text-zinc-500 font-mono">PDF, PNG, JPG &lt; 10MB</p>
                </div>
              )}
            </div>
            {fileError && (
              <p className="text-[11px] text-red-400 font-mono">{fileError}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="px-4 py-1.5 rounded-lg font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
