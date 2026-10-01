"use client";

import React, { useState } from "react";
import { CampusDocument, MOCK_ACADEMIC_DOCUMENTS, MOCK_NON_ACADEMIC_DOCUMENTS } from "../../lib/services/documents-data";
import { DocumentCard } from "./document-card";
import { DocumentModal } from "./document-modal";
import { GraduationCap, Sparkles, Filter } from "lucide-react";
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
    <div className={cn("space-y-6", className)}>
      {/* Segmented Control / Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            {activeTab === "academic" ? (
              <>
                <GraduationCap className="w-5 h-5 text-blue-400" />
                <span>Academic Records & Credentials</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Campus Activities & Service Passes</span>
              </>
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {activeTab === "academic"
              ? "Official degree certificates, transcripts, attendance summaries, and cards."
              : "Hostel passes, event clearances, transport vouchers, and club memberships."}
          </p>
        </div>

        {/* Polished Segmented Control */}
        <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto select-none shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("academic")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2",
              activeTab === "academic"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            aria-selected={activeTab === "academic"}
            role="tab"
          >
            <span>Academic</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                activeTab === "academic" ? "bg-blue-700 text-white" : "bg-zinc-800 text-zinc-400"
              )}
            >
              {MOCK_ACADEMIC_DOCUMENTS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("non-academic")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2",
              activeTab === "non-academic"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            aria-selected={activeTab === "non-academic"}
            role="tab"
          >
            <span>Non-Academic</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                activeTab === "non-academic"
                  ? "bg-emerald-700 text-white"
                  : "bg-zinc-800 text-zinc-400"
              )}
            >
              {MOCK_NON_ACADEMIC_DOCUMENTS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => (
          <DocumentCard key={doc.id} document={doc} onView={setSelectedDoc} />
        ))}
      </div>

      {/* Document Detail Inspection Modal */}
      <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
}
