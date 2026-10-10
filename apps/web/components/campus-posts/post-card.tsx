"use client";

import React, { useState } from "react";
import { CampusPost, CampusPostComment } from "@smart-campus/contracts";
import { useCampusAuth } from "@/components/auth/auth-guard";
import { campusPostsClientService } from "@/lib/services/campus-posts-client-service";
import { canVerifyPost } from "@/lib/campus-posts/campus-post-permissions";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShieldCheck,
  FileText,
  Download,
  Trash2,
  Send,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface PostCardProps {
  post: CampusPost;
  onPostUpdated?: (updated: CampusPost) => void;
}

export function PostCard({ post, onPostUpdated }: PostCardProps) {
  const { user } = useCampusAuth();

  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [dislikesCount, setDislikesCount] = useState(post.dislikesCount);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(
    post.userReaction || null
  );
  const [reacting, setReacting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CampusPostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);

  // Check if current user is authorized to verify this post
  const userAuthContext = user
    ? {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        institutionalId: user.institutionalId,
        departmentCode: user.departmentCode,
        tags: user.tags,
      }
    : null;

  const canVerify =
    userAuthContext &&
    post.verificationStatus !== "verified" &&
    canVerifyPost(userAuthContext, {
      authorProfileId: post.authorProfileId,
      authorDepartment: post.authorDepartment,
      audience: post.audience,
    });

  const handleReaction = async (type: "like" | "dislike") => {
    if (reacting) return;
    setReacting(true);

    const prevReaction = userReaction;
    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;

    // Optimistic UI update
    if (userReaction === type) {
      setUserReaction(null);
      if (type === "like") setLikesCount((c) => Math.max(0, c - 1));
      if (type === "dislike") setDislikesCount((c) => Math.max(0, c - 1));
    } else {
      setUserReaction(type);
      if (type === "like") {
        setLikesCount((c) => c + 1);
        if (prevReaction === "dislike")
          setDislikesCount((c) => Math.max(0, c - 1));
      } else {
        setDislikesCount((c) => c + 1);
        if (prevReaction === "like") setLikesCount((c) => Math.max(0, c - 1));
      }
    }

    try {
      const res = await campusPostsClientService.react(post.id, type);
      if (res) {
        setLikesCount(res.likesCount);
        setDislikesCount(res.dislikesCount);
        setUserReaction(res.userReaction);
      }
    } catch (_err) {
      // Revert accurately if network fails
      setUserReaction(prevReaction);
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
    } finally {
      setReacting(false);
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const data = await campusPostsClientService.getComments(post.id);
      setComments(data);
      setLoadingComments(false);
    }
    setShowComments((prev) => !prev);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || postingComment) return;

    setPostingComment(true);
    setCommentError(null);

    const res = await campusPostsClientService.addComment(
      post.id,
      newComment.trim()
    );
    setPostingComment(false);

    if (res.success && res.comment) {
      setComments((prev) => [...prev, res.comment!]);
      setNewComment("");
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: post.commentsCount + 1,
        });
      }
    } else {
      setCommentError(res.error || "Failed to post comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const success = await campusPostsClientService.deleteComment(
      post.id,
      commentId
    );
    if (success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: Math.max(0, post.commentsCount - 1),
        });
      }
    }
  };

  const handleVerify = async () => {
    if (!canVerify || verifying) return;
    setVerifying(true);

    const res = await campusPostsClientService.verifyPost(
      post.id,
      "verified",
      "Officially verified by authorized coordinator."
    );
    setVerifying(false);

    if (res.success && res.post && onPostUpdated) {
      onPostUpdated(res.post);
    }
  };

  const getRoleLabel = () => {
    switch (post.authorRoleCategory) {
      case "student_coordinator":
        return "Student Coordinator";
      case "department_coordinator":
        return "Department Coordinator";
      case "faculty":
        return "Faculty";
      case "admin":
        return "Administration";
      default:
        return "Student";
    }
  };

  return (
    <article className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-border/80 transition-colors shadow-sm select-none text-card-foreground">
      {/* Header: Author Info, Role, Department & Audience Scope */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
            {post.authorName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {post.authorName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-muted text-muted-foreground border-border">
                {getRoleLabel()}
              </span>
              {post.authorDepartment && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {post.authorDepartment}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Target: {post.audience.displayName || post.audience.scope}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border",
              post.category === "academic"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-secondary text-secondary-foreground border-border"
            )}
          >
            {post.category}
          </span>

          {post.verificationStatus === "verified" ? (
            <button
              type="button"
              onClick={() => setShowVerificationDetails((p) => !p)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-500/20 transition-colors"
              title="Click to view verifier details"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </button>
          ) : canVerify ? (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-secondary hover:bg-muted border border-border px-2 py-0.5 rounded transition-colors disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
              )}
              <span>Verify Post</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded border border-border bg-muted/40">
              Unverified
            </span>
          )}
        </div>
      </header>

      {/* Verification details modal/accordion */}
      {showVerificationDetails && post.verificationInfo && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Official Institutional Verification</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5 pl-5">
            <p>
              Verified by:{" "}
              <strong className="text-foreground">
                {post.verificationInfo.verifierName}
              </strong>{" "}
              ({post.verificationInfo.verifierRole} •{" "}
              {post.verificationInfo.verifierDepartment || "Campus"})
            </p>
            <p>Scope: {post.verificationInfo.scope}</p>
            {post.verificationInfo.note && (
              <p className="italic">Note: &quot;{post.verificationInfo.note}&quot;</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Attachments Section */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
            Attachments ({post.attachments.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {post.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate font-mono text-[11px]">
                    {att.originalFilename}
                  </span>
                </div>
                <a
                  href={`/api/documents/mock-preview?ref=${encodeURIComponent(att.originalFilename)}`}
                  download={att.originalFilename}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Download Attachment"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Controls: Like, Dislike, Comments */}
      <footer className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => handleReaction("like")}
            disabled={reacting}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors",
              userReaction === "like"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-label="Like post"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">{likesCount}</span>
          </button>

          {/* Dislike Button */}
          <button
            type="button"
            onClick={() => handleReaction("dislike")}
            disabled={reacting}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors",
              userReaction === "dislike"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-label="Dislike post"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">{dislikesCount}</span>
          </button>
        </div>

        {/* Comments Toggle */}
        <button
          type="button"
          onClick={toggleComments}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors",
            showComments
              ? "bg-muted text-foreground font-medium"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          aria-label="Toggle comments"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">
            {comments.length || post.commentsCount}
          </span>
          <span className="hidden sm:inline">Comments</span>
        </button>
      </footer>

      {/* Comments Section */}
      {showComments && (
        <section className="pt-3 border-t border-border space-y-3">
          {loadingComments ? (
            <div className="py-4 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading discussion...</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg border border-border bg-muted/40 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {c.authorRole}
                      </span>
                    </div>

                    {(c.authorProfileId === user?.id ||
                      user?.role === "admin") && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-foreground/90 leading-relaxed">{c.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No comments yet. Start the conversation.
                </p>
              )}
            </div>
          )}

          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
            <input
              type="text"
              required
              maxLength={1000}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            <button
              type="submit"
              disabled={postingComment || !newComment.trim()}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {postingComment ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>Post</span>
            </button>
          </form>
          {commentError && (
            <p className="text-[11px] text-destructive font-mono">{commentError}</p>
          )}
        </section>
      )}
    </article>
  );
}
