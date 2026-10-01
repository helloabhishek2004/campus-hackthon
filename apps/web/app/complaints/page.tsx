"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@smart-campus/ui";
import {
  ComplaintRecord,
  ComplaintAttachment,
  ComplaintCategory,
  CreateComplaintResponse,
  ComplaintListResponse,
} from "@smart-campus/contracts";
import {
  AlertTriangle,
  CheckCircle2,
  Upload,
  X,
  RefreshCw,
  Clock,
  Layers,
  ArrowLeft,
  Flame,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function ComplaintsPage() {
  // Form State
  const [complaintText, setComplaintText] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("infrastructure");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    message: string;
    isEmergency: boolean;
    groupCount: number;
    clusterId: string;
  } | null>(null);

  // Feed State
  const [activeTab, setActiveTab] = useState<"all" | "normal" | "emergency">("all");
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [counts, setCounts] = useState({ total: 0, normal: 0, emergency: 0 });
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Modal State
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<{
    clusterId: string;
    items: ComplaintRecord[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load complaints
  const fetchComplaints = async (view: "all" | "normal" | "emergency") => {
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/complaints?view=${view}`);
      const data: ComplaintListResponse = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
        setCounts(data.counts);
      } else {
        setFeedError(data.error?.message || "Failed to load complaints");
      }
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchComplaints(activeTab);
  }, [activeTab]);

  // Group emergency complaints into unique clusters
  const emergencyClusters = useMemo(() => {
    const map = new Map<string, ComplaintRecord[]>();
    for (const c of complaints) {
      if (c.is_emergency) {
        const list = map.get(c.cluster_id) || [];
        list.push(c);
        map.set(c.cluster_id, list);
      }
    }
    return Array.from(map.entries()).map(([clusterId, items]) => {
      const sorted = [...items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const latest = sorted[0];
      const attachment = sorted
        .flatMap((it) => it.attachments || [])
        .find((att) => !!att?.url);

      return {
        clusterId,
        items: sorted,
        count: sorted.length,
        latestReport: latest,
        category: latest.category || "General",
        latestDate: latest.created_at,
        thumbnailUrl: attachment?.url,
      };
    });
  }, [complaints]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormError(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Only image files (JPEG, PNG, WebP, GIF) are accepted.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image file size must not exceed 5 MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(null);

    const trimmed = complaintText.trim();
    if (trimmed.length < 5) {
      setFormError("Complaint description must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const attachments: ComplaintAttachment[] = [];

      // 1. Upload image if selected (strictly storage/display, ZERO ML)
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/complaints/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error?.message || "Failed to upload image attachment");
        }

        attachments.push(uploadData.attachment);
      }

      // 2. Submit complaint with text (similarity pipeline uses ONLY text)
      const submitRes = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          category,
          attachments,
        }),
      });

      const submitData: CreateComplaintResponse = await submitRes.json();

      if (!submitRes.ok || !submitData.success || !submitData.complaint) {
        throw new Error(submitData.error?.message || "Failed to register complaint");
      }

      const clusterInfo = submitData.cluster || {
        cluster_id: submitData.complaint.cluster_id,
        group_count: submitData.complaint.similar_count,
        is_emergency: submitData.complaint.is_emergency,
      };

      setSubmitSuccess({
        message: "Your complaint has been successfully recorded and grouped.",
        isEmergency: clusterInfo.is_emergency,
        groupCount: clusterInfo.group_count,
        clusterId: clusterInfo.cluster_id,
      });

      // Clear form
      setComplaintText("");
      handleRemoveImage();

      // Refresh list
      fetchComplaints(activeTab);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submission error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
        <div>
          <Link
            href="/"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 font-medium mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal Home
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Campus Complaint System
            </h1>
            <Badge variant="default">CampusGram</Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Automated text-similarity grouping & emergency thresholding (&ge; 5 reports escalate to Emergency).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchComplaints(activeTab)}
            disabled={isLoadingFeed}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeed ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complaint Submission Form (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="sticky top-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-slate-900 dark:text-slate-50">Submit a Grievance</CardTitle>
              </div>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Describe your campus issue. Similarity is calculated strictly from text.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Text Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Complaint Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[110px] break-words whitespace-pre-wrap"
                    placeholder="e.g. Water is not available in hostel block A since morning..."
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mt-1">
                    <span>Min 5 characters</span>
                    <span>{complaintText.length} chars</span>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    disabled={isSubmitting}
                  >
                    <option value="infrastructure">Infrastructure & Maintenance</option>
                    <option value="hostel">Hostel & Living</option>
                    <option value="sanitation">Sanitation & Water</option>
                    <option value="it_services">Campus IT & Network</option>
                    <option value="academic">Academic & Classroom</option>
                    <option value="security">Campus Security & Safety</option>
                    <option value="administration">Administration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Image Attachment (strictly storage/display, NO ML) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Optional Image Attachment
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {!previewUrl ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-medium">Click to attach photo (max 5 MB)</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">JPG, PNG, WebP, GIF only</span>
                    </button>
                  ) : (
                    <div className="relative border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800/50">
                      <div className="relative h-40 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        {/* Preview */}
                        <img
                          src={previewUrl}
                          alt="Attachment preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {selectedFile?.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-7 px-2 text-xs flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation / Form Error */}
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submission Success Feedback */}
                {submitSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-md text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{submitSuccess.message}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={submitSuccess.isEmergency ? "destructive" : "secondary"}
                        className="text-[11px]"
                      >
                        {submitSuccess.isEmergency
                          ? "Escalated to Emergency"
                          : "Status: Normal Priority"}
                      </Badge>
                      <span className="text-slate-600 dark:text-slate-300">
                        Group size: <strong>{submitSuccess.groupCount}</strong> complaints
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || complaintText.trim().length < 5}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing & Grouping...
                    </>
                  ) : (
                    "Submit Complaint"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Complaint Feed & Emergency / Normal Views (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                All Grievances
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "all" ? "bg-blue-800 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {counts.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("normal")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "normal"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Normal
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "normal" ? "bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {counts.normal}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("emergency")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "emergency"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Emergency (&ge; 5)
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "emergency" ? "bg-red-800 text-white" : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200"
                }`}>
                  {counts.emergency}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Threshold: &ge; 5 items
            </div>
          </div>

          {/* Emergency Alert Banner if Emergency Issues Exist */}
          {counts.emergency > 0 && activeTab !== "normal" && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Active Campus Emergency Clusters Detected!</strong>
                <p className="text-red-700 dark:text-red-300 text-[11px] mt-0.5">
                  Complaints grouped with 5 or more matching reports have been automatically escalated to Emergency priority.
                </p>
              </div>
            </div>
          )}

          {/* Feed Error */}
          {feedError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              <span>{feedError}</span>
            </div>
          )}

          {/* Feed List Rendering */}
          {isLoadingFeed ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">Loading complaints...</span>
            </div>
          ) : activeTab === "emergency" ? (
            /* Emergency View: Grouped by cluster_id into 1 card per cluster */
            emergencyClusters.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No active emergency complaints.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No similarity groups have reached the 5-complaint emergency threshold yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyClusters.map((cluster) => (
                  <Card
                    key={cluster.clusterId}
                    className="border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-900 transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="flex items-center gap-1 font-bold text-white bg-red-600 dark:bg-red-600">
                            <Flame className="w-3 h-3" /> EMERGENCY CLUSTER
                          </Badge>

                          <Badge
                            variant="outline"
                            className="capitalize text-[11px] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          >
                            {cluster.category?.replace("_", " ") || "General"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Latest: {formatDate(cluster.latestDate)}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 text-sm">
                      <p className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed break-words whitespace-pre-wrap">
                        {cluster.latestReport.text}
                      </p>

                      {/* Display thumbnail if cluster has any attached images */}
                      {cluster.thumbnailUrl && (
                        <div className="pt-1">
                          <div
                            onClick={() => setExpandedImage(cluster.thumbnailUrl || null)}
                            className="group relative h-20 w-28 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-2xs hover:opacity-90"
                          >
                            <img
                              src={cluster.thumbnailUrl}
                              alt="Cluster attachment thumbnail"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                              View Image
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Similarity Group:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                          {cluster.clusterId.substring(0, 16)}...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200 dark:border dark:border-red-800">
                          {cluster.count} similar reports
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCluster({ clusterId: cluster.clusterId, items: cluster.items })}
                          className="h-7 text-xs px-2.5 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/50"
                        >
                          View reports ({cluster.count}) &rarr;
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
          ) : (
            /* All or Normal View */
            complaints.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeTab === "normal"
                    ? "No normal complaints."
                    : "No complaints have been reported yet."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTab === "normal"
                    ? "There are currently no normal priority complaints."
                    : "No grievances registered. Submit one using the form on the left."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((item) => {
                  const isEmergency = item.is_emergency;

                  return (
                    <Card
                      key={item.id}
                      className={`transition-shadow hover:shadow-md ${
                        isEmergency
                          ? "border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-900"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isEmergency ? (
                              <Badge variant="destructive" className="flex items-center gap-1 font-bold text-white bg-red-600 dark:bg-red-600">
                                <Flame className="w-3 h-3" /> EMERGENCY
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                Normal
                              </Badge>
                            )}

                            <Badge
                              variant="outline"
                              className="capitalize text-[11px] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            >
                              {item.category?.replace("_", " ") || "General"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 text-sm">
                        <p className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed break-words whitespace-pre-wrap">
                          {item.text}
                        </p>

                        {/* Attached Image if available (Display ONLY) */}
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex items-center gap-3 pt-1">
                            {item.attachments.map((att, idx) => (
                              <div
                                key={att.id || idx}
                                onClick={() => setExpandedImage(att.url)}
                                className="group relative h-20 w-28 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-2xs hover:opacity-90"
                              >
                                <img
                                  src={att.url}
                                  alt={att.filename || "Complaint attachment"}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                                  View
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Cluster & Similar count badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Similarity Group:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                            {item.cluster_id.substring(0, 16)}...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              isEmergency
                                ? "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200 dark:border dark:border-red-800 font-bold"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {item.similar_count} {item.similar_count === 1 ? "report" : "similar reports"}
                          </span>

                          {isEmergency && item.similar_count >= 5 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const clusterItems = complaints.filter(
                                  (c) => c.cluster_id === item.cluster_id,
                                );
                                setSelectedCluster({
                                  clusterId: item.cluster_id,
                                  items: clusterItems.length > 0 ? clusterItems : [item],
                                });
                              }}
                              className="h-7 text-xs px-2 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/50"
                            >
                              View cluster &rarr;
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Cluster Reports Detail Modal */}
      {selectedCluster && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedCluster(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="flex items-center gap-1 font-bold text-white bg-red-600 dark:bg-red-600">
                    <Flame className="w-3 h-3" /> EMERGENCY CLUSTER
                  </Badge>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedCluster.items.length} Reports Registered
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-md">
                  Cluster ID: {selectedCluster.clusterId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCluster(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Report List */}
            <div className="overflow-y-auto p-4 space-y-3">
              <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2.5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  All complaints below matched with lexical text similarity &ge; 0.35 and were aggregated into this emergency incident group.
                </span>
              </div>

              {selectedCluster.items.map((report, idx) => (
                <div
                  key={report.id || idx}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                        #{idx + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className="capitalize text-[10px] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      >
                        {report.category?.replace("_", " ") || "General"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                    {report.text}
                  </p>

                  {report.attachments && report.attachments.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {report.attachments.map((att, attIdx) => (
                        <div
                          key={att.id || attIdx}
                          onClick={() => setExpandedImage(att.url)}
                          className="group relative h-16 w-24 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={att.url}
                            alt={att.filename || "Attachment"}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px]">
                            View
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCluster(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-3 right-3 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 p-1.5 rounded-full shadow-md z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={expandedImage}
              alt="Enlarged attachment"
              className="max-h-[80vh] w-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
