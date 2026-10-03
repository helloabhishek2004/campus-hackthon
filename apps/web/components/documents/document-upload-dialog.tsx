"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CampusDocument,
  DocumentType,
} from "@smart-campus/contracts";
import { documentsClientService } from "../../lib/services/documents-client-service";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: CampusDocument) => void;
}

export function DocumentUploadDialog({
  isOpen,
  onClose,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"academic" | "non-academic">("academic");
  const [remarks, setRemarks] = useState("");
  const [validThrough, setValidThrough] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (isOpen) {
      documentsClientService.getDocumentTypes().then((data) => {
        const uploadable = data.filter((t) => t.isUploadable);
        setTypes(uploadable);
        if (uploadable.length > 0) {
          setSelectedTypeCode(uploadable[0].code);
          setCategory(uploadable[0].category);
        }
      });
    } else {
      // Reset form
      setTitle("");
      setRemarks("");
      setValidThrough("");
      setFile(null);
      setFileError(null);
      setGeneralError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  const handleTypeChange = (code: string) => {
    setSelectedTypeCode(code);
    const matched = types.find((t) => t.code === code);
    if (matched) {
      setCategory(matched.category);
      if (!title) {
        setTitle(matched.name);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setFileError("Invalid format. Please upload a PDF, PNG, JPG, or WEBP file.");
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFileError("File exceeds 10MB maximum limit.");
      setFile(null);
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeCode || !title.trim() || !file) {
      setGeneralError("Please fill out all required fields and attach a file.");
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    const formData = new FormData();
    formData.append("typeCode", selectedTypeCode);
    formData.append("title", title.trim());
    formData.append("category", category);
    if (validThrough) {
      formData.append("validThrough", new Date(validThrough).toISOString());
    }
    if (remarks.trim()) {
      formData.append("remarks", remarks.trim());
    }
    formData.append("file", file);

    const result = await documentsClientService.uploadDocument(formData);

    setSubmitting(false);

    if (result.success && result.document) {
      onSuccess(result.document);
      onClose();
    } else {
      setGeneralError(result.error || "Failed to submit document. Please try again.");
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-apple-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden transition-all animate-apple-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/80 dark:bg-zinc-950/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 id="upload-dialog-title" className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Submit New Document
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Upload institutional certificates, passes, or requests for verification.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="apple-press p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label="Close upload dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="upload-doc-form" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {generalError && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2.5 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Document Type Dropdown */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Document Type</label>
            <select
              value={selectedTypeCode}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            >
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bonafide Application - Visa Submission"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            />
          </div>

          {/* Category Toggle */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("academic")}
                className={cn(
                  "py-1.5 px-3 rounded-lg border text-center font-medium transition-colors text-[11px]",
                  category === "academic"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                    : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                Academic
              </button>
              <button
                type="button"
                onClick={() => setCategory("non-academic")}
                className={cn(
                  "py-1.5 px-3 rounded-lg border text-center font-medium transition-colors text-[11px]",
                  category === "non-academic"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                    : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                Non-Academic
              </button>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Attach Document</label>
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
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-xs">Click to select PDF, PNG, JPG (&lt;10MB)</span>
                </div>
              )}
            </div>
            {fileError && <p className="text-[11px] text-red-500 font-mono">{fileError}</p>}
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Remarks / Purpose (Optional)</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Submitting for Dean approval..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none leading-relaxed"
            />
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
            form="upload-doc-form"
            disabled={submitting}
            className="apple-press px-4 py-1.5 rounded-lg text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Submit Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
