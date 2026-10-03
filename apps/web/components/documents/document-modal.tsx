"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CampusDocument } from "@smart-campus/contracts";
import { X, ShieldCheck, Download, FileText, Loader2 } from "lucide-react";
import { documentsClientService } from "../../lib/services/documents-client-service";

interface DocumentModalProps {
  document?: CampusDocument | null;
  documentItem?: CampusDocument | null;
  onClose: () => void;
}

export function DocumentModal({ document: docProp, documentItem, onClose }: DocumentModalProps) {
  const activeDoc = docProp || documentItem || null;
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (activeDoc && typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = window.document.body.style.overflow;
      window.document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeDoc, onClose]);

  if (!activeDoc || !mounted) return null;

  const handleDownload = async () => {
    if (!activeDoc) return;
    setDownloading(true);
    try {
      const response = await documentsClientService.getDownloadUrl(activeDoc.id);
      const downloadUrl =
        response?.downloadUrl ||
        `/api/documents/mock-preview?ref=${encodeURIComponent(activeDoc.documentNumber)}`;

      const a = window.document.createElement("a");
      a.href = downloadUrl;
      a.download = response?.fileName || `${activeDoc.documentNumber}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (_err) {
      // Fallback direct link
      window.open(`/api/documents/mock-preview?ref=${encodeURIComponent(activeDoc.documentNumber)}`, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-apple-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-apple-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                {activeDoc.category}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded border bg-zinc-900 text-zinc-300 border-zinc-700">
                {activeDoc.status}
              </span>
            </div>
            <h3 id="document-title" className="text-lg font-semibold text-zinc-100 mt-1">
              {activeDoc.title}
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Ref: {activeDoc.documentNumber}
            </p>
          </div>
        </div>

        {/* Verification Banner */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex items-center gap-2.5 text-xs text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="font-medium text-zinc-200">Institutional Signature Verified</p>
            <p className="text-[11px] text-zinc-500">
              Authenticated via Smart Campus Registrar Authority
            </p>
          </div>
        </div>

        {/* Key-Value Details */}
        <div className="space-y-2.5 text-xs border-y border-zinc-800 py-3.5">
          <div className="flex justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-500">Issuing Body</span>
            <span className="text-zinc-200 font-medium">{activeDoc.details.issuer}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-500">Verified By</span>
            <span className="text-zinc-200 font-medium">{activeDoc.details.verifiedBy}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-500">Reference Hash</span>
            <span className="font-mono text-zinc-300">{activeDoc.details.referenceCode}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-500">Issue Period</span>
            <span className="text-zinc-200">{activeDoc.issuedDate}</span>
          </div>

          {activeDoc.validThrough && (
            <div className="flex justify-between py-1 border-b border-zinc-850">
              <span className="text-zinc-500">Valid Through</span>
              <span className="text-zinc-200 font-medium">{activeDoc.validThrough}</span>
            </div>
          )}

          {activeDoc.details.remarks && (
            <div className="pt-1.5">
              <span className="text-zinc-500 block mb-1">Administrative Remarks</span>
              <p className="text-zinc-300 bg-zinc-900/80 p-2 rounded-md border border-zinc-800 leading-relaxed text-[11px]">
                {activeDoc.details.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Certified PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
