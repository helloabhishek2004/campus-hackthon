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
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "RETURNED":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "UNDER_REVIEW":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-secondary text-secondary-foreground border-border";
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
                  Evaluation & Verification
                </span>
                <span className="text-xs text-muted-foreground">
                  Assigned Classes & Academic Scopes Only
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Student Submissions Review
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Review submitted assignments, project reports, and academic records from students enrolled in your scope.
              </p>
            </div>

            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors self-start sm:self-auto"
              title="Refresh submissions"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between text-card-foreground">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending Review</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{pendingCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between text-card-foreground">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Accepted</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{acceptedCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between text-card-foreground">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Returned for Revision</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{returnedCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
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
                    ? "bg-card text-foreground border-border font-semibold shadow-xs"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, ID, or title..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>
        </div>

        {/* Submissions List / Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-xs">
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            Loading student submissions...
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="space-y-3">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-card-foreground"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">
                      {sub.studentName}
                    </span>
                    {sub.studentInstitutionalId && (
                      <span className="font-mono text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded border border-border">
                        {sub.studentInstitutionalId}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {sub.programCode} Section {sub.section} (Year {sub.academicYear}, Sem {sub.semester})
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    {sub.documentTitle}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span>Submitted {formatDate(sub.submittedAt)}</span>
                    {sub.attachmentName && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Paperclip className="w-3 h-3" />
                        {sub.attachmentName}
                      </span>
                    )}
                    {sub.remarks && (
                      <span className="text-muted-foreground italic truncate max-w-xs">
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
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-muted text-foreground border border-border transition-colors flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 rounded-xl border border-dashed border-border text-center max-w-md mx-auto">
            <CheckSquare className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No submissions found
            </h3>
            <p className="text-xs text-muted-foreground">
              {statusFilter !== "ALL"
                ? `No submissions found matching '${statusFilter}'.`
                : "No student submissions currently recorded for your assigned courses."}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-card-foreground">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div>
                <h3 className="text-base font-bold text-foreground">Evaluate Student Submission</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedSubmission.studentName} ({selectedSubmission.studentInstitutionalId})
                </p>
              </div>
              <button
                onClick={handleCloseReview}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {reviewError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Assignment & Submission Info */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Document:</span>
                  <span className="font-semibold text-foreground">{selectedSubmission.documentTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Class Scope:</span>
                  <span className="text-foreground">
                    {selectedSubmission.programCode} Section {selectedSubmission.section} (Sem {selectedSubmission.semester})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="text-foreground">{formatDate(selectedSubmission.submittedAt)}</span>
                </div>
              </div>

              {/* Attached File */}
              {selectedSubmission.attachmentName && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedSubmission.attachmentName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Verified institutional upload</span>
                </div>
              )}

              {/* Review Evaluation Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Evaluation Verdict <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Accept", value: "ACCEPTED" as const, color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
                    { label: "Return", value: "RETURNED" as const, color: "text-amber-600 dark:text-amber-400 border-amber-500/30" },
                    { label: "Under Review", value: "UNDER_REVIEW" as const, color: "text-blue-600 dark:text-blue-400 border-blue-500/30" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReviewStatus(opt.value)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center",
                        reviewStatus === opt.value
                          ? `bg-secondary font-bold ${opt.color} shadow-xs`
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Feedback & Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide remarks or instructions for the student..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <button
                type="button"
                onClick={handleCloseReview}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
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
