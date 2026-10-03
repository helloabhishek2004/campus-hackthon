"use client";

import React, { useState } from "react";
import { CampusDocument, MOCK_ACADEMIC_DOCUMENTS, MOCK_NON_ACADEMIC_DOCUMENTS } from "../../lib/services/documents-data";
import { DocumentCard } from "./document-card";
import { DocumentModal } from "./document-modal";
import { GraduationCap, FileText } from "lucide-react";
import { cn } from "@smart-campus/utils";

type TabMode = "academic" | "non-academic";

interface DocumentTabsProps {
  initialTab?: TabMode;
  className?: string;
  limit?: number;
}

export function DocumentTabs({ initialTab = "academic", className, limit }: DocumentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);
  const [selectedDoc, setSelectedDoc] = useState<CampusDocument | null>(null);

  const rawDocs = activeTab === "academic" ? MOCK_ACADEMIC_DOCUMENTS : MOCK_NON_ACADEMIC_DOCUMENTS;
  const docs = limit ? rawDocs.slice(0, limit) : rawDocs;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Segmented Control & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            {activeTab === "academic" ? (
              <>
                <GraduationCap className="w-4 h-4 text-zinc-400" />
                <span>Academic Records</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-zinc-400" />
                <span>Campus Passes & Authorizations</span>
              </>
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {activeTab === "academic"
              ? "Digitally certified enrollment proofs, transcripts, and attendance summaries."
              : "Access credentials, residential passes, and campus activity certifications."}
          </p>
        </div>

        {/* shadcn style Segmented Tabs */}
        <div
          role="tablist"
          className="inline-flex p-1 rounded-lg bg-zinc-900 border border-zinc-800 self-start sm:self-auto select-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "academic"}
            onClick={() => setActiveTab("academic")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2",
              activeTab === "academic"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>Academic</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-700/60 text-zinc-400">
              {MOCK_ACADEMIC_DOCUMENTS.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "non-academic"}
            onClick={() => setActiveTab("non-academic")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2",
              activeTab === "non-academic"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>Non-Academic</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-700/60 text-zinc-400">
              {MOCK_NON_ACADEMIC_DOCUMENTS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {docs.map((doc) => (
          <DocumentCard key={doc.id} document={doc} onView={setSelectedDoc} />
        ))}
      </div>

      {/* Inspection Modal */}
      <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
}
