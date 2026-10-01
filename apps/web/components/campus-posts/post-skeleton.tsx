import React from "react";

export function PostCardSkeleton() {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-24 rounded bg-zinc-800" />
              <div className="h-3 w-16 rounded bg-zinc-800/80" />
            </div>
            <div className="h-2.5 w-32 rounded bg-zinc-800/60" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-zinc-800" />
          <div className="h-4 w-14 rounded bg-zinc-800/70" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded bg-zinc-800" />
        <div className="space-y-1.5 pt-1">
          <div className="h-3.5 w-full rounded bg-zinc-800/70" />
          <div className="h-3.5 w-5/6 rounded bg-zinc-800/70" />
          <div className="h-3.5 w-2/3 rounded bg-zinc-800/70" />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-14 rounded bg-zinc-800" />
          <div className="h-7 w-14 rounded bg-zinc-800" />
          <div className="h-7 w-20 rounded bg-zinc-800" />
        </div>
        <div className="h-3 w-20 rounded bg-zinc-800/60" />
      </div>
    </article>
  );
}

export function FeedSkeletonStream({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
