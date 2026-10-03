"use client";

import React, { useState, useEffect, useRef } from "react";
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
    if (!title.trim()) {
      setGeneralError("Please enter a document title.");
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    const formData = new FormData();
    formData.append("documentTypeCode", selectedTypeCode || "BONAFIDE_CERT");
    formData.append("title", title.trim());
    formData.append("category", category);
    if (remarks.trim()) formData.append("remarks", remarks.trim());
    if (validThrough.trim()) formData.append("validThrough", validThrough.trim());
    if (file) formData.append("file", file);

    const result = await documentsClientService.uploadDocument(formData);
    setSubmitting(false);

    if (result.success && result.document) {
      onSuccess(result.document);
      onClose();
    } else {
      setGeneralError(result.error || "Failed to submit document. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
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
          aria-label="Close upload dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 id="upload-dialog-title" className="text-base font-semibold text-zinc-100">
              Submit New Document
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload institutional certificates, passes, or event permissions for verification.
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
          {/* Document Type Dropdown */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Document Type</label>
            <select
              value={selectedTypeCode}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            >
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bonafide Application - Visa Submission"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            />
          </div>

          {/* Category Toggle */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Classification</label>
            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Attach Document (PDF, PNG, JPG &lt; 10MB)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-4 rounded-xl border border-dashed text-center cursor-pointer transition-colors space-y-1.5",
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
                  <span className="font-mono text-xs">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <FileText className="w-5 h-5 text-zinc-500 mx-auto" />
                  <p className="text-zinc-300 font-medium">Click to select file</p>
                  <p className="text-[11px] text-zinc-500 font-mono">Max size 10MB</p>
                </div>
              )}
            </div>
            {fileError && <p className="text-[11px] text-red-400 font-mono">{fileError}</p>}
          </div>

          {/* Optional remarks */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Remarks / Purpose (Optional)</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Submitting for Dean approval"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
        </form>
      </div>
    </div>
  );
}
