"use client";

import React from "react";
import { CampusDocument } from "../../lib/services/documents-data";
import { X, ShieldCheck, Download, CheckCircle, FileCheck, Building, Hash } from "lucide-react";
import { Badge } from "@smart-campus/ui";

interface DocumentModalProps {
  document: CampusDocument | null;
  onClose: () => void;
}

export function DocumentModal({ document, onClose }: DocumentModalProps) {
  if (!document) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          aria-label="Close document modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {document.category}
              </span>
              <Badge variant={document.statusVariant === "success" ? "success" : "secondary"}>
                {document.status}
              </Badge>
            </div>
            <h3 id="document-title" className="text-xl font-bold text-zinc-100 mt-1">
              {document.title}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Doc ID: {document.documentNumber}
            </p>
          </div>
        </div>

        {/* Verified Banner */}
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 flex items-center gap-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold">Institutional Digital Signature Verified</p>
            <p className="text-[11px] text-emerald-400/80">
              Authenticated via Smart Campus Registrar Authority
            </p>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="space-y-3 text-xs border-y border-zinc-800 py-4">
          <div className="flex justify-between py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500">Issuing Body</span>
            <span className="text-zinc-200 font-medium">{document.details.issuer}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500">Verified By</span>
            <span className="text-zinc-200 font-medium">{document.details.verifiedBy}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500">Reference Hash</span>
            <span className="font-mono text-zinc-300">{document.details.referenceCode}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-800/40">
            <span className="text-zinc-500">Issue Period</span>
            <span className="text-zinc-200">{document.issuedDate}</span>
          </div>

          {document.validThrough && (
            <div className="flex justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-500">Valid Through</span>
              <span className="text-zinc-200 font-medium text-emerald-400">
                {document.validThrough}
              </span>
            </div>
          )}

          {document.details.remarks && (
            <div className="pt-2">
              <span className="text-zinc-500 block mb-1">Administrative Remarks:</span>
              <p className="text-zinc-300 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 leading-relaxed">
                {document.details.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert(`Simulated Download: ${document.title} (${document.documentNumber}.pdf)`);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Certified Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
