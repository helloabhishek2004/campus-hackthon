"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
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
  ShieldAlert,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

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
  const fetchComplaintsSeq = useRef(0);

  // Keyboard Escape listener to dismiss open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expandedImage) {
          setExpandedImage(null);
        } else if (selectedCluster) {
          setSelectedCluster(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImage, selectedCluster]);

  // Load complaints with in-flight race condition protection
  const fetchComplaints = async (view: "all" | "normal" | "emergency") => {
    const currentSeq = ++fetchComplaintsSeq.current;
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/complaints?view=${view}`);
      const data: ComplaintListResponse = await res.json();
      if (currentSeq === fetchComplaintsSeq.current) {
        if (data.success) {
          setComplaints(data.complaints);
          setCounts(data.counts);
        } else {
          setFeedError(data.error?.message || "Failed to load complaints");
        }
      }
    } catch (err) {
      if (currentSeq === fetchComplaintsSeq.current) {
        setFeedError(err instanceof Error ? err.message : "Network error");
      }
    } finally {
      if (currentSeq === fetchComplaintsSeq.current) {
        setIsLoadingFeed(false);
      }
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
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latest = sorted[0];

      // Find first available thumbnail among all attachments
      let thumbnail: string | null = null;
      for (const item of items) {
        if (item.attachments && item.attachments.length > 0) {
          thumbnail = item.attachments[0].url;
          break;
        }
      }

      return {
        clusterId,
        count: items.length,
        category: latest.category,
        latestDate: latest.created_at,
        latestReport: latest,
        items: sorted,
        thumbnailUrl: thumbnail,
      };
    });
  }, [complaints]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setFormError("Only JPG, PNG, WebP, and GIF images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must not exceed 5 MB.");
      return;
    }

    setFormError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(null);

    const trimmed = complaintText.trim();
    if (trimmed.length < 5) {
      setFormError("Complaint text must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const attachments: ComplaintAttachment[] = [];

      // 1. Upload image if selected
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

      // 2. Submit complaint with text (similarity pipeline uses text)
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
        message: "Your complaint has been recorded and clustered with AI similarity.",
        isEmergency: clusterInfo.is_emergency,
        groupCount: clusterInfo.group_count,
        clusterId: clusterInfo.cluster_id,
      });

      setComplaintText("");
      handleRemoveImage();
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
    <AppShell>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-4 h-4 rounded-sm overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0">
                <img src="/assets/campus_gram_icon.svg" alt="CampusGram" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold tracking-wider">
                Module 2
              </span>
              <span className="text-xs text-zinc-500 font-mono">Grievance Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Campus Complaints System</span>
              <FileText className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              AI-assisted severity evaluation, duplicate clustering, and automated department routing. 
              Clusters with 5 or more corroborating reports escalate to Emergency automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/emergency"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Life-Safety SOS</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComplaints(activeTab)}
              disabled={isLoadingFeed}
              className="flex items-center gap-1.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingFeed && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Complaint Submission Form (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="sticky top-20 border-zinc-800 bg-zinc-900/70 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <CardTitle className="text-sm font-semibold text-zinc-100">
                    File a New Grievance
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-zinc-400">
                  Describe your campus issue. Similarity is computed strictly from text representation.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {/* Text Area */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Issue Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 min-h-[105px] break-words whitespace-pre-wrap"
                      placeholder="e.g. Water is not available in hostel block A since morning. Pressure pump seems damaged..."
                      value={complaintText}
                      onChange={(e) => setComplaintText(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 font-mono">
                      <span>Min 5 characters</span>
                      <span>{complaintText.length} chars</span>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
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

                  {/* Image Attachment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Attachment (Optional Photo)
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
                        className="w-full border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg p-3.5 flex flex-col items-center justify-center gap-1.5 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-medium">Attach Photo (max 5 MB)</span>
                        <span className="text-[10px] text-zinc-600">JPG, PNG, WebP only</span>
                      </button>
                    ) : (
                      <div className="relative border border-zinc-800 rounded-lg p-2 bg-zinc-950">
                        <div className="relative h-32 w-full overflow-hidden rounded bg-zinc-900 flex items-center justify-center">
                          <img
                            src={previewUrl}
                            alt="Attachment preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 px-1">
                          <span className="text-xs text-zinc-300 truncate max-w-[180px]">
                            {selectedFile?.name}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Error */}
                  {formError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submission Feedback */}
                  {submitSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{submitSuccess.message}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded font-semibold",
                            submitSuccess.isEmergency
                              ? "bg-red-900/80 text-red-200 border border-red-800"
                              : "bg-zinc-800 text-zinc-300"
                          )}
                        >
                          {submitSuccess.isEmergency ? "Escalated to Emergency" : "Normal Priority"}
                        </span>
                        <span className="text-zinc-400 text-[11px]">
                          Cluster count: <strong>{submitSuccess.groupCount}</strong> reports
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || complaintText.trim().length < 5}
                    className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold text-xs py-2 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analyzing & Grouping...
                      </>
                    ) : (
                      "Submit Grievance"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Right Column: Feed & Views (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    activeTab === "all"
                      ? "bg-zinc-800 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  )}
                >
                  All Grievances
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                    {counts.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("normal")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    activeTab === "normal"
                      ? "bg-zinc-800 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  )}
                >
                  Normal
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                    {counts.normal}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("emergency")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    activeTab === "emergency"
                      ? "bg-red-950/80 border border-red-800/80 text-red-200 font-semibold"
                      : "text-red-400/80 hover:text-red-300 hover:bg-red-950/30"
                  )}
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  Emergency (&ge; 5)
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-900/60 text-red-200 border border-red-800">
                    {counts.emergency}
                  </span>
                </button>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                Threshold: &ge; 5
              </div>
            </div>

            {/* Emergency Alert Banner */}
            {counts.emergency > 0 && activeTab !== "normal" && (
              <div className="p-3 bg-red-950/30 border border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-red-200">Active High-Volume Escalations!</strong>
                  <p className="text-red-300/80 text-[11px] mt-0.5">
                    Issues reported by 5 or more distinct members have auto-escalated to Emergency status for expedited dispatch.
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {feedError && (
              <div className="p-4 bg-red-950/40 border border-red-900 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{feedError}</span>
              </div>
            )}

            {/* List */}
            {isLoadingFeed ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                <span className="text-xs">Loading grievance records...</span>
              </div>
            ) : activeTab === "emergency" ? (
              /* Emergency View */
              emergencyClusters.length === 0 ? (
                <div className="p-10 text-center bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-500 space-y-2">
                  <Layers className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">No active emergency clusters</p>
                  <p className="text-[11px] text-zinc-500">
                    No similarity groups have met the 5-complaint threshold yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emergencyClusters.map((cluster) => (
                    <Card
                      key={cluster.clusterId}
                      className="border-red-900/60 bg-red-950/20 rounded-xl transition-colors hover:border-red-700/80"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-900 text-red-100 border border-red-700">
                              <Flame className="w-3 h-3 text-red-200" /> EMERGENCY CLUSTER
                            </span>

                            <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
                              {cluster.category?.replace("_", " ") || "General"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>Latest: {formatDate(cluster.latestDate)}</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 text-xs">
                        <p className="text-zinc-200 font-medium leading-relaxed break-words whitespace-pre-wrap">
                          {cluster.latestReport.text}
                        </p>

                        {cluster.thumbnailUrl && (
                          <div className="pt-1">
                            <div
                              onClick={() => setExpandedImage(cluster.thumbnailUrl || null)}
                              className="group relative h-20 w-28 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer hover:opacity-90"
                            >
                              <img
                                src={cluster.thumbnailUrl}
                                alt="Cluster attachment"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-100 text-[10px] font-medium">
                                View
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 text-[11px]">Cluster ID:</span>
                          <span className="font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] border border-zinc-800">
                            {cluster.clusterId.substring(0, 14)}...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-red-900/40 text-red-200 border border-red-800/80 font-mono">
                            {cluster.count} matching reports
                          </span>

                          <button
                            onClick={() => setSelectedCluster({ clusterId: cluster.clusterId, items: cluster.items })}
                            className="text-xs px-2.5 py-1 rounded-lg text-red-300 border border-red-900/60 bg-red-950/40 hover:bg-red-900/40 transition-colors font-medium"
                          >
                            Inspect Group ({cluster.count}) &rarr;
                          </button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              /* All or Normal View */
              complaints.length === 0 ? (
                <div className="p-10 text-center bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-500 space-y-2">
                  <Layers className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">
                    {activeTab === "normal"
                      ? "No normal complaints currently."
                      : "No complaints have been reported yet."}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Use the form on the left to submit a grievance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((item) => {
                    const isEmergency = item.is_emergency;

                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "rounded-xl transition-colors",
                          isEmergency
                            ? "border-red-900/60 bg-red-950/20"
                            : "border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700/80"
                        )}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isEmergency ? (
                                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-900 text-red-100 border border-red-700">
                                  <Flame className="w-3 h-3 text-red-200" /> EMERGENCY
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                  Standard
                                </span>
                              )}

                              <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                                {item.category?.replace("_", " ") || "General"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3 text-xs">
                          <p className="text-zinc-200 font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {item.text}
                          </p>

                          {item.attachments && item.attachments.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              {item.attachments.map((att, idx) => (
                                <div
                                  key={att.id || idx}
                                  onClick={() => setExpandedImage(att.url)}
                                  className="group relative h-16 w-24 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer hover:opacity-90"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.filename || "Attachment"}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-100 text-[9px]">
                                    View
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Cluster:</span>
                            <span className="font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] border border-zinc-800">
                              {item.cluster_id.substring(0, 14)}...
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-mono text-[10px] px-2 py-0.5 rounded font-medium",
                                isEmergency
                                  ? "bg-red-900/40 text-red-200 border border-red-800"
                                  : "bg-zinc-800 text-zinc-400"
                              )}
                            >
                              {item.similar_count} {item.similar_count === 1 ? "report" : "similar reports"}
                            </span>

                            {isEmergency && item.similar_count >= 5 && (
                              <button
                                onClick={() => {
                                  const clusterItems = complaints.filter(
                                    (c) => c.cluster_id === item.cluster_id
                                  );
                                  setSelectedCluster({
                                    clusterId: item.cluster_id,
                                    items: clusterItems.length > 0 ? clusterItems : [item],
                                  });
                                }}
                                className="text-xs px-2.5 py-1 rounded-lg text-red-300 border border-red-900/60 bg-red-950/40 hover:bg-red-900/40 transition-colors font-medium"
                              >
                                View cluster &rarr;
                              </button>
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

        {/* Cluster Detail Modal */}
        {selectedCluster && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setSelectedCluster(null)}
          >
            <div
              className="relative max-w-2xl w-full max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-zinc-900/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-900 text-red-100 border border-red-700">
                      <Flame className="w-3 h-3 text-red-200" /> EMERGENCY CLUSTER
                    </span>
                    <span className="font-semibold text-zinc-100 text-sm">
                      {selectedCluster.items.length} Reports Registered
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono truncate max-w-md">
                    Cluster ID: {selectedCluster.clusterId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCluster(null)}
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 space-y-3">
                <div className="text-xs text-amber-200 bg-amber-950/30 border border-amber-900/50 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Reports below matched with lexical text similarity &ge; 0.35 and were aggregated into this emergency incident group.
                  </span>
                </div>

                {selectedCluster.items.map((report, idx) => (
                  <div
                    key={report.id || idx}
                    className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-500 font-semibold">#{idx + 1}</span>
                        <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                          {report.category?.replace("_", " ") || "General"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-500 text-[11px] font-mono">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-zinc-200 text-xs font-medium leading-relaxed break-words whitespace-pre-wrap">
                      {report.text}
                    </p>

                    {report.attachments && report.attachments.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {report.attachments.map((att, attIdx) => (
                          <div
                            key={att.id || attIdx}
                            onClick={() => setExpandedImage(att.url)}
                            className="group relative h-16 w-24 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden cursor-pointer"
                          >
                            <img
                              src={att.url}
                              alt={att.filename || "Attachment"}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-100 text-[9px]">
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
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCluster(null)}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enlarged Image Modal */}
        {expandedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setExpandedImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-3 right-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 p-1.5 rounded-full z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={expandedImage}
                alt="Enlarged attachment"
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
