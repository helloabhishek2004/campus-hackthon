"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import {
  AcademicDocument,
  AcademicDocumentType,
} from "@smart-campus/contracts";
import { facultyAcademicClientService } from "@/lib/services/faculty-academic-client-service";
import { AcademicDocCard } from "@/components/faculty/academic-doc-card";
import { AcademicDocDetailDialog } from "@/components/faculty/academic-doc-detail-dialog";
import { CreateAcademicDocDialog } from "@/components/faculty/create-academic-doc-dialog";
import {
  Inbox,
  Send,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

const FILTER_PILLS = [
  { label: "All Types", value: "all" },
  { label: "Academic Notices", value: "Academic Notice" },
  { label: "Assignments", value: "Assignment" },
  { label: "Exam Schedules", value: "Exam Schedule" },
  { label: "Class Schedules", value: "Class Schedule" },
  { label: "Department Notices", value: "Department Notice" },
  { label: "Course Materials", value: "Course Material" },
];

function FacultyDocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "sent" ? "sent" : "received";

  const { user } = useCampusAuth();
  const [tab, setTab] = useState<"received" | "sent">(initialTab);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [selectedDoc, setSelectedDoc] = useState<AcademicDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // Sync tab with URL
  const handleTabChange = (newTab: "received" | "sent") => {
    setTab(newTab);
    setDocuments([]);
    setNextCursor(null);
    router.replace(`/faculty/documents?tab=${newTab}`);
  };

  const fetchDocuments = useCallback(
    async (cursor?: string, append = false) => {
      setLoading(true);
      try {
        const res = await facultyAcademicClientService.getDocuments({
          tab,
          filter: filter === "all" ? undefined : filter,
          search: searchQuery.trim() || undefined,
          cursor,
          limit: 15,
        });

        if (append) {
          setDocuments((prev) => [...prev, ...res.items]);
        } else {
          setDocuments(res.items);
        }

        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        if (res.unreadCount !== undefined) {
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        setLoading(false);
      }
    },
    [tab, filter, searchQuery]
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSelectDoc = (doc: AcademicDocument) => {
    setSelectedDoc(doc);
    setDetailModalOpen(true);
  };

  const handleDocumentUpdated = (updatedDoc: AcademicDocument) => {
    setSelectedDoc(updatedDoc);
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
    if (tab === "received") {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleComposeSuccess = (newDoc: AcademicDocument) => {
    if (tab === "sent") {
      setDocuments((prev) => [newDoc, ...prev]);
    } else {
      handleTabChange("sent");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <header className="border-b border-border pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
                  Document Records
                </span>
                <span className="text-xs text-muted-foreground">
                  Official Academic Communications
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Academic Documents & Notices
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Search, filter, review, and issue academic communications with audited delivery and read receipts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDocuments()}
                disabled={loading}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                title="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>

              <button
                onClick={() => setComposeOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Compose Document
              </button>
            </div>
          </div>
        </header>

        {/* Tab Selector & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange("received")}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                tab === "received"
                  ? "bg-card text-foreground border border-border shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              )}
            >
              <Inbox className="w-4 h-4 text-blue-500" />
              Received Notices
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("sent")}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                tab === "sent"
                  ? "bg-card text-foreground border border-border shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              )}
            >
              <Send className="w-4 h-4 text-emerald-500" />
              Sent Communications
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setFilter(pill.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                filter === pill.value
                  ? "bg-card text-foreground border-border font-semibold shadow-xs"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-muted"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Documents Grid / Empty State */}
        {loading && documents.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-muted-foreground" />
            Loading academic documents...
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <AcademicDocCard
                  key={doc.id}
                  document={doc}
                  viewMode={tab}
                  onSelect={handleSelectDoc}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && nextCursor && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => fetchDocuments(nextCursor, true)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-card hover:bg-muted text-foreground border border-border transition-colors flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Load more documents
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 rounded-2xl border border-dashed border-border text-center max-w-md mx-auto">
            <FileText className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No academic documents found
            </h3>
            <p className="text-xs text-muted-foreground mb-4 px-4 leading-relaxed">
              {tab === "received"
                ? "No notices or circulars match your current filter."
                : "You have not published any academic documents matching this criteria."}
            </p>
            {tab === "sent" && (
              <button
                onClick={() => setComposeOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Compose New Document
              </button>
            )}
          </div>
        )}
      </div>

      {/* Compose Academic Document Dialog */}
      <CreateAcademicDocDialog
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />

      {/* Document Detail Modal */}
      <AcademicDocDetailDialog
        document={selectedDoc}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onDocumentUpdated={handleDocumentUpdated}
        isSentView={tab === "sent"}
      />
    </AppShell>
  );
}

export default function FacultyDocumentsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-muted-foreground" />
            Loading academic documents...
          </div>
        </AppShell>
      }
    >
      <FacultyDocumentsContent />
    </Suspense>
  );
}
