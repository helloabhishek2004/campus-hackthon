"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { PostCard } from "@/components/campus-posts/post-card";
import { CreatePostDialog } from "@/components/campus-posts/create-post-dialog";
import { CampusPost } from "@smart-campus/contracts";
import { campusPostsClientService } from "@/lib/services/campus-posts-client-service";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@smart-campus/utils";

export default function HomePage() {
  const { user } = useCampusAuth();

  const [filter, setFilter] = useState<"all" | "academic" | "non-academic">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<CampusPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await campusPostsClientService.getFeed({
        category: filter,
        query: searchQuery,
      });
      setPosts(data);
    } catch (_err) {
      // Handled in client service
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handlePostCreated = (newPost: CampusPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updated: CampusPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Student";
  const academicCount = posts.filter((p) => p.category === "academic").length;
  const nonAcademicCount = posts.filter((p) => p.category === "non-academic").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <header className="border-b border-zinc-800/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Here is your targeted campus feed and student updates.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => fetchFeed()}
                title="Refresh feed"
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                aria-label="Refresh feed"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", loading && "animate-spin text-zinc-300")}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Post</span>
              </button>
            </div>
          </div>
        </header>

        {/* User Institutional Context Banner */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-xs">
              {user?.departmentCode || "CAMPUS"}
            </div>
            <div>
              <p className="font-semibold text-zinc-200">
                {user?.departmentName || "General Campus Community"}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {user?.role === "student"
                  ? `Year ${user?.academicYear || 3} • Sem ${user?.semester || 6} (${user?.section || "A"})`
                  : user?.designation || user?.role}
                {user?.tags && user.tags.length > 0 && ` • [${user.tags.join(", ")}]`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
              Audience Scope Verified
            </span>
            <Link
              href="/documents"
              className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 transition-colors ml-2"
            >
              <span>Personal Documents</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices, events, or publishers..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
            />
          </div>

          {/* Segmented Filter Control */}
          <div
            role="tablist"
            className="inline-flex p-1 rounded-lg bg-zinc-900 border border-zinc-800 self-start sm:self-auto select-none text-xs"
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 rounded-md font-medium transition-colors",
                filter === "all"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              All Updates ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("academic")}
              className={cn(
                "px-3 py-1 rounded-md font-medium transition-colors",
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
                "px-3 py-1 rounded-md font-medium transition-colors",
                filter === "non-academic"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Non-Academic ({nonAcademicCount})
            </button>
          </div>
        </section>

        {/* Information Feed Stream */}
        {loading && posts.length === 0 ? (
          <div className="py-20 text-center rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400">Loading campus updates for your audience...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={handlePostUpdated}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-medium text-zinc-200">No updates found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              There are no published updates matching your audience scope or search terms.
            </p>
          </div>
        )}

        {/* Quick Portal Services Row */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-medium text-zinc-200">Campus Services Navigation</p>
            <p className="text-zinc-500">
              Access your personal credential documents or search the Lost & Found repository.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium border border-zinc-700 transition-colors"
            >
              <span>Personal Documents</span>
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
            <Link
              href="/lost-and-found"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium border border-zinc-700 transition-colors"
            >
              <span>Lost & Found Hub</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </section>

        {/* Create Post Dialog */}
        <CreatePostDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handlePostCreated}
        />
      </div>
    </AppShell>
  );
}
