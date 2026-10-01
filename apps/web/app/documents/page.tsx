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
import { Search, FileText } from "lucide-react";
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
      <div className="space-y-6">
        {/* Header */}
        <header className="border-b border-zinc-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Documents & Credentials
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Access official university credentials, student certificates, and activity passes.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-zinc-400 font-mono">
              <span>{filteredDocs.length} of {ALL_DOCUMENTS.length} records</span>
            </div>
          </div>
        </header>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, reference, or description..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
            />
          </div>

          {/* Segmented Filter Control */}
          <div
            role="tablist"
            className="inline-flex p-1 rounded-lg bg-zinc-900 border border-zinc-800 self-start sm:self-auto select-none"
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                filter === "all"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              All ({ALL_DOCUMENTS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("academic")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                filter === "academic"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Academic ({MOCK_ACADEMIC_DOCUMENTS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("non-academic")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                filter === "non-academic"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Non-Academic ({MOCK_NON_ACADEMIC_DOCUMENTS.length})
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredDocs.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onView={setSelectedDoc} />
            ))}
          </div>
        ) : (
          /* Simple, restrained empty state per Section 36 */
          <div className="py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-medium text-zinc-200">No documents found</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              No official documents matched your query. Try clearing your filter or search terms.
            </p>
          </div>
        )}

        {/* Modal */}
        <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      </div>
    </AppShell>
  );
}
