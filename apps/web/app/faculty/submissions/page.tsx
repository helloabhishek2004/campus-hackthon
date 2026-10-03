"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { ReviewStudentSubmissionRequest } from "@smart-campus/contracts";
import {
  facultyAcademicClientService,
  StudentSubmissionItem,
} from "@/lib/services/faculty-academic-client-service";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Paperclip,
  Download,
  Loader2,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

export default function FacultySubmissionsPage() {
  const { user } = useCampusAuth();
  const [submissions, setSubmissions] = useState<StudentSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Dialog State
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmissionItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"ACCEPTED" | "RETURNED" | "UNDER_REVIEW">("ACCEPTED");
  const [remarks, setRemarks] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await facultyAcademicClientService.getStudentSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load student submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleOpenReview = (submission: StudentSubmissionItem) => {
    setSelectedSubmission(submission);
    setReviewStatus(
      submission.status === "SUBMITTED" || submission.status === "RECEIVED"
        ? "ACCEPTED"
        : (submission.status as "ACCEPTED" | "RETURNED" | "UNDER_REVIEW")
    );
    setRemarks(submission.remarks || "");
    setReviewError(null);
  };

  const handleCloseReview = () => {
    setSelectedSubmission(null);
    setReviewError(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;
    setSubmittingReview(true);
    setReviewError(null);

    const reviewRequest: ReviewStudentSubmissionRequest = {
      status: reviewStatus,
      remarks: remarks.trim() || undefined,
    };

    const res = await facultyAcademicClientService.reviewStudentSubmission(
      selectedSubmission.id,
      reviewRequest
    );

    setSubmittingReview(false);

    if (!res.success) {
      setReviewError(res.error || "Failed to submit review.");
      return;
    }

    // Update in local state
    if (res.submission) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === res.submission!.id ? res.submission! : s))
      );
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                status: reviewStatus,
                remarks: remarks.trim() || undefined,
                reviewedAt: new Date().toISOString(),
                reviewedBy: user?.fullName,
              }
            : s
        )
      );
    }

    setSelectedSubmission(null);
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesStudent = s.studentName.toLowerCase().includes(q);
      const matchesRoll = s.studentInstitutionalId?.toLowerCase().includes(q);
      const matchesTitle = s.documentTitle.toLowerCase().includes(q);
      const matchesDept = s.departmentCode?.toLowerCase().includes(q);
      return matchesStudent || matchesRoll || matchesTitle || matchesDept;
    }
    return true;
  });

  const pendingCount = submissions.filter(
    (s) => s.status === "SUBMITTED" || s.status === "RECEIVED" || s.status === "UNDER_REVIEW"
  ).length;
  const acceptedCount = submissions.filter((s) => s.status === "ACCEPTED").length;
  const returnedCount = submissions.filter((s) => s.status === "RETURNED").length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "RETURNED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "UNDER_REVIEW":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <header className="border-b border-neutral-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Evaluation & Verification
                </span>
                <span className="text-xs text-neutral-500">
                  Assigned Classes & Academic Scopes Only
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Student Submissions Review
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Review submitted assignments, project reports, and academic records from students enrolled in your scope.
              </p>
            </div>

            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-colors self-start sm:self-auto"
              title="Refresh submissions"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Pending Review</p>
              <h3 className="text-xl font-bold text-white mt-1">{pendingCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Accepted</p>
              <h3 className="text-xl font-bold text-white mt-1">{acceptedCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Returned for Revision</p>
              <h3 className="text-xl font-bold text-white mt-1">{returnedCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { label: "All Submissions", value: "ALL" },
              { label: "Under Review", value: "UNDER_REVIEW" },
              { label: "Accepted", value: "ACCEPTED" },
              { label: "Returned", value: "RETURNED" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setStatusFilter(p.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                  statusFilter === p.value
                    ? "bg-neutral-200 text-neutral-950 border-white font-semibold"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, ID, or title..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        {/* Submissions List / Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs">
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            Loading student submissions...
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="space-y-3">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">
                      {sub.studentName}
                    </span>
                    {sub.studentInstitutionalId && (
                      <span className="font-mono text-[11px] text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded border border-neutral-700">
                        {sub.studentInstitutionalId}
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">·</span>
                    <span className="text-xs text-neutral-400">
                      {sub.programCode} Section {sub.section} (Year {sub.academicYear}, Sem {sub.semester})
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-neutral-200">
                    {sub.documentTitle}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 flex-wrap">
                    <span>Submitted {formatDate(sub.submittedAt)}</span>
                    {sub.attachmentName && (
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Paperclip className="w-3 h-3" />
                        {sub.attachmentName}
                      </span>
                    )}
                    {sub.remarks && (
                      <span className="text-neutral-400 italic truncate max-w-xs">
                        &quot;{sub.remarks}&quot;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-full border uppercase tracking-wider",
                      getStatusBadge(sub.status)
                    )}
                  >
                    {sub.status.replace("_", " ")}
                  </span>

                  <button
                    onClick={() => handleOpenReview(sub)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 rounded-xl border border-dashed border-neutral-800 text-center max-w-md mx-auto">
            <CheckSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">
              No submissions found
            </h3>
            <p className="text-xs text-neutral-400">
              {statusFilter !== "ALL"
                ? `No submissions found matching '${statusFilter}'.`
                : "No student submissions currently recorded for your assigned courses."}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
              <div>
                <h3 className="text-base font-bold text-white">Evaluate Student Submission</h3>
                <p className="text-xs text-neutral-400">
                  {selectedSubmission.studentName} ({selectedSubmission.studentInstitutionalId})
                </p>
              </div>
              <button
                onClick={handleCloseReview}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {reviewError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Assignment & Submission Info */}
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Document:</span>
                  <span className="font-semibold text-white">{selectedSubmission.documentTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Class Scope:</span>
                  <span className="text-neutral-200">
                    {selectedSubmission.programCode} Section {selectedSubmission.section} (Sem {selectedSubmission.semester})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Submitted:</span>
                  <span className="text-neutral-300">{formatDate(selectedSubmission.submittedAt)}</span>
                </div>
              </div>

              {/* Attached File */}
              {selectedSubmission.attachmentName && (
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-neutral-200">
                    <Paperclip className="w-4 h-4 text-neutral-400" />
                    <span>{selectedSubmission.attachmentName}</span>
                  </div>
                  <span className="text-xs text-neutral-500">Verified institutional upload</span>
                </div>
              )}

              {/* Review Evaluation Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Evaluation Verdict <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Accept", value: "ACCEPTED" as const, color: "text-emerald-400 border-emerald-500/30" },
                    { label: "Return", value: "RETURNED" as const, color: "text-amber-400 border-amber-500/30" },
                    { label: "Under Review", value: "UNDER_REVIEW" as const, color: "text-blue-400 border-blue-500/30" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReviewStatus(opt.value)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center",
                        reviewStatus === opt.value
                          ? `bg-neutral-800 font-bold ${opt.color} shadow-sm`
                          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Feedback & Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide remarks or instructions for the student..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-950/40">
              <button
                type="button"
                onClick={handleCloseReview}
                className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-neutral-950 hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-sm"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Save Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
