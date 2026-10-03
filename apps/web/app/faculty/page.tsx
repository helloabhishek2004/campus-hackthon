"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import {
  FacultyDashboardOverview,
  AcademicDocument,
} from "@smart-campus/contracts";
import { facultyAcademicClientService } from "@/lib/services/faculty-academic-client-service";
import { AcademicDocCard } from "@/components/faculty/academic-doc-card";
import { AcademicDocDetailDialog } from "@/components/faculty/academic-doc-detail-dialog";
import { CreateAcademicDocDialog } from "@/components/faculty/create-academic-doc-dialog";
import {
  FileText,
  Send,
  Inbox,
  CheckSquare,
  Users,
  Plus,
  ArrowRight,
  BookOpen,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function FacultyDashboardPage() {
  const { user } = useCampusAuth();
  const [overview, setOverview] = useState<FacultyDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<AcademicDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isSentDetail, setIsSentDetail] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await facultyAcademicClientService.getDashboardOverview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load faculty overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSelectDoc = (doc: AcademicDocument, isSent: boolean) => {
    setSelectedDoc(doc);
    setIsSentDetail(isSent);
    setDetailModalOpen(true);
  };

  const handleDocumentUpdated = (updatedDoc: AcademicDocument) => {
    setSelectedDoc(updatedDoc);
    fetchOverview();
  };

  const handleComposeSuccess = () => {
    fetchOverview();
  };

  // If student tries to access, show polite access restricted message
  if (user && user.role === "student") {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Faculty Portal Access Restricted</h2>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            The faculty academic communication portal is restricted to authorized faculty members, course coordinators, and department heads. Students can view assigned academic notices and circulars directly from their Documents page.
          </p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium border border-neutral-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Go to Academic Documents
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Top Header */}
        <header className="border-b border-neutral-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Academic Governance
                </span>
                <span className="text-xs text-neutral-500">
                  {user?.departmentCode ? `${user.departmentCode} Department` : "Faculty Portal"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Faculty Communication & Records
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Issue course materials, official notices, exam schedules, and manage student submissions across authorized scopes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchOverview}
                disabled={loading}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-colors"
                title="Refresh dashboard"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>

              <button
                onClick={() => setComposeOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-neutral-950 hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Publish Document
              </button>
            </div>
          </div>
        </header>

        {/* Quick Stat Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Unread Notices */}
          <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Unread Notices</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {overview?.unreadDocumentsCount ?? 0}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">Awaiting your review</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Sent Communications */}
          <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Sent Documents</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {overview?.sentDocumentsCount ?? 0}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">Published to classes & courses</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Pending Submissions */}
          <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Student Submissions</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {overview?.pendingSubmissionsCount ?? 0}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">Pending evaluation</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Active Assignments */}
          <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Authorized Scopes</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {overview?.assignments.length ?? 0}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">Courses & sections</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Assigned Academic Roles & Scopes Bar */}
        {overview?.assignments && overview.assignments.length > 0 && (
          <section className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                  Active Faculty Assignments & Authorized Scopes
                </h3>
              </div>
              <span className="text-[11px] text-neutral-500">
                Audited Institutional Records
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {overview.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800/80 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {assignment.roleTitle}
                      </span>
                      <p className="text-xs font-semibold text-white mt-1.5">
                        {assignment.courseCode ? `${assignment.courseCode}` : `${assignment.programCode} Section ${assignment.section}`}
                      </p>
                      {assignment.courseName && (
                        <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                          {assignment.courseName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-neutral-500 flex items-center gap-2">
                    <span>Year {assignment.academicYear} · Sem {assignment.semester}</span>
                    <span>· Sec {assignment.section}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Content Grid: Recent Received & Sent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section A: Received Academic Notices */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-semibold text-white">Received Notices & Circulars</h2>
              </div>
              <Link
                href="/faculty/documents?tab=received"
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                Loading recent academic notices...
              </div>
            ) : overview?.recentReceived && overview.recentReceived.length > 0 ? (
              <div className="space-y-3">
                {overview.recentReceived.slice(0, 3).map((doc) => (
                  <AcademicDocCard
                    key={doc.id}
                    document={doc}
                    viewMode="received"
                    onSelect={() => handleSelectDoc(doc, false)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-neutral-800 text-center">
                <p className="text-xs text-neutral-400">No received academic documents found.</p>
              </div>
            )}
          </section>

          {/* Section B: Sent Communications */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Sent Communications</h2>
              </div>
              <Link
                href="/faculty/documents?tab=sent"
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                Loading sent communications...
              </div>
            ) : overview?.recentSent && overview.recentSent.length > 0 ? (
              <div className="space-y-3">
                {overview.recentSent.slice(0, 3).map((doc) => (
                  <AcademicDocCard
                    key={doc.id}
                    document={doc}
                    viewMode="sent"
                    onSelect={() => handleSelectDoc(doc, true)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-neutral-800 text-center">
                <p className="text-xs text-neutral-400 mb-3">You have not published any academic documents yet.</p>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Compose your first document
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Quick Links Section */}
        <section className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">
            Faculty Academic Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/faculty/documents?tab=sent"
              className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center gap-3 group"
            >
              <div className="p-2 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 text-white transition-colors">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Sent Documents</p>
                <p className="text-[11px] text-neutral-400">Track student read status</p>
              </div>
            </Link>

            <Link
              href="/faculty/submissions"
              className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center gap-3 group"
            >
              <div className="p-2 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 text-white transition-colors">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Review Submissions</p>
                <p className="text-[11px] text-neutral-400">Grade & approve assignments</p>
              </div>
            </Link>

            <Link
              href="/faculty/documents?tab=received"
              className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center gap-3 group"
            >
              <div className="p-2 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 text-white transition-colors">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Faculty Inbox</p>
                <p className="text-[11px] text-neutral-400">HOD notices & schedules</p>
              </div>
            </Link>
          </div>
        </section>
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
        isSentView={isSentDetail}
      />
    </AppShell>
  );
}
