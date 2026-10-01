"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentModal } from "@/components/documents/document-modal";
import {
  CampusDocument,
  MOCK_ACADEMIC_DOCUMENTS,
  MOCK_NON_ACADEMIC_DOCUMENTS,
} from "@/lib/services/documents-data";
import { Search, Filter, FileText, CheckCircle2, DownloadCloud } from "lucide-react";
import { cn } from "@smart-campus/utils";

const ALL_DOCUMENTS: CampusDocument[] = [
  ...MOCK_ACADEMIC_DOCUMENTS,
  ...MOCK_NON_ACADEMIC_DOCUMENTS,
];

export default function DocumentsPage() {
  const [filter, setFilter] = useState<"all" | "academic" | "non-academic">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<CampusDocument | null>(null);

  const filteredDocs = ALL_DOCUMENTS.filter((doc) => {
    const matchesFilter = filter === "all" || doc.category === filter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Registry
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {filteredDocs.length} Documents Available
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
              Documents & Credentials
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Access and download official university credentials, student certificates, and activity passes.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, document ID, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto select-none">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === "all"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              All ({ALL_DOCUMENTS.length})
            </button>
            <button
              onClick={() => setFilter("academic")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === "academic"
                  ? "bg-blue-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Academic ({MOCK_ACADEMIC_DOCUMENTS.length})
            </button>
            <button
              onClick={() => setFilter("non-academic")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === "non-academic"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Non-Academic ({MOCK_NON_ACADEMIC_DOCUMENTS.length})
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onView={setSelectedDoc} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-base font-semibold text-zinc-300">No documents match your query</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your filter or search terms to locate your certificate or record.
            </p>
          </div>
        )}

        {/* Modal */}
        <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      </div>
    </AppShell>
  );
}
