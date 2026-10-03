"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { PostCard } from "@/components/campus-posts/post-card";
import { FeedSkeletonStream } from "@/components/campus-posts/post-skeleton";
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
  X,
  GraduationCap,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@smart-campus/utils";

const PAGE_SIZE = 20;

export default function HomePage() {
  const { user } = useCampusAuth();

  const [filter, setFilter] = useState<"all" | "academic" | "non-academic">("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  const [posts, setPosts] = useState<CampusPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const requestSeqRef = useRef(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Initial and filtered feed fetch with race condition protection
  const fetchFeed = useCallback(async () => {
    const currentSeq = ++requestSeqRef.current;
    setLoading(true);
    try {
      const res = await campusPostsClientService.getFeed({
        category: filter,
        query: debouncedQuery,
        limit: PAGE_SIZE,
      });

      if (currentSeq === requestSeqRef.current) {
        setPosts(res.items);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setTotalCount(res.count);
      }
    } catch (_err) {
      // Handled in client service
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [filter, debouncedQuery]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Infinite cursor-based pagination
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await campusPostsClientService.getFeed({
        category: filter,
        query: debouncedQuery,
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newUnique = res.items.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newUnique];
      });

      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (_err) {
      // Failed to load more
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostCreated = (newPost: CampusPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handlePostUpdated = (updated: CampusPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedQuery("");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Student";
  const academicLoadedCount = posts.filter((p) => p.category === "academic").length;
  const nonAcademicLoadedCount = posts.filter((p) => p.category === "non-academic").length;

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
          {/* Debounced Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search notices, events, or publishers..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
              All Updates {posts.length > 0 && `(${filter === "all" ? totalCount : posts.length})`}
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
              Academic {academicLoadedCount > 0 && `(${filter === "academic" ? totalCount : academicLoadedCount})`}
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
              Non-Academic {nonAcademicLoadedCount > 0 && `(${filter === "non-academic" ? totalCount : nonAcademicLoadedCount})`}
            </button>
          </div>
        </section>

        {/* Information Feed Stream */}
        {loading ? (
          <FeedSkeletonStream count={4} />
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={handlePostUpdated}
              />
            ))}

            {/* Pagination Controls */}
            {hasMore && (
              <div className="pt-3 pb-2 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-50 shadow-sm"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading more updates...</span>
                    </>
                  ) : (
                    <>
                      <span>Load more updates</span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        ({posts.length} of {totalCount})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Contextual Empty States (Zero Emojis) */
          <div className="py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
            {debouncedQuery ? (
              <>
                <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-medium text-zinc-200">
                  No updates matching &quot;{debouncedQuery}&quot;
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Try checking your search terms or clearing filters to view all campus updates.
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Clear Search</span>
                </button>
              </>
            ) : filter === "academic" ? (
              <>
                <GraduationCap className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-medium text-zinc-200">No academic notices</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are currently no departmental notices, exam circulars, or schedules published for your audience scope.
                </p>
              </>
            ) : filter === "non-academic" ? (
              <>
                <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-medium text-zinc-200">No campus activities</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are no student activities, hackathons, or club events published for your audience scope.
                </p>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-medium text-zinc-200">No updates found</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are no published updates matching your audience scope at this time.
                </p>
              </>
            )}
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
