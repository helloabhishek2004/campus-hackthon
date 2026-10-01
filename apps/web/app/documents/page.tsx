"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentModal } from "@/components/documents/document-modal";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { CampusDocument } from "@smart-campus/contracts";
import { documentsClientService } from "@/lib/services/documents-client-service";
import { Search, FileText, Upload, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function DocumentsPage() {
  const [filter, setFilter] = useState<"all" | "academic" | "non-academic">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<CampusDocument | null>(null);
  const [documents, setDocuments] = useState<CampusDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentsClientService.getDocuments({
        category: filter,
        query: searchQuery,
      });
      setDocuments(data);
    } catch (_err) {
      // Handled gracefully in client service
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadSuccess = (newDoc: CampusDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
  };

  const academicCount = documents.filter((d) => d.category === "academic").length;
  const nonAcademicCount = documents.filter((d) => d.category === "non-academic").length;

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

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => fetchDocuments()}
                title="Refresh Documents"
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                aria-label="Refresh documents list"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-zinc-300")} />
              </button>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
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
              All ({documents.length})
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
              Academic ({academicCount})
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
              Non-Academic ({nonAcademicCount})
            </button>
          </div>
        </div>

        {/* Documents Grid / States */}
        {loading && documents.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400">Loading documents from institutional directory...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onView={setSelectedDoc} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-medium text-zinc-200">No documents found</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              No official documents matched your query. Try clearing your filter or uploading a new document.
            </p>
          </div>
        )}

        {/* Modal */}
        <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />

        {/* Upload Dialog */}
        <DocumentUploadDialog
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      </div>
    </AppShell>
  );
}
