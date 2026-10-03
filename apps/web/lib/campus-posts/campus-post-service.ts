import {
  CampusPost,
  CampusPostComment,
  CampusPostReactionType,
  CreateCampusPostRequest,
  VerifyCampusPostRequest,
} from "@smart-campus/contracts";
import { createClient } from "../supabase/server";
import {
  UserAuthContext,
  resolveUserRoleCategory,
  canPublishCategory,
  canTargetAudience,
  canVerifyPost,
  isPostVisibleToUser,
} from "./campus-post-permissions";

// ==============================================================================
// In-Memory Seed / Mock State (for offline development and zero-config test mode)
// ==============================================================================

import { INITIAL_MOCK_POSTS, INITIAL_MOCK_COMMENTS } from "./campus-posts-seed-data";

// ==============================================================================
// In-Memory Seed / Mock State (for offline development and zero-config test mode)
// ==============================================================================

let IN_MEMORY_POSTS: CampusPost[] = [...INITIAL_MOCK_POSTS];
let IN_MEMORY_REACTIONS: Array<{
  postId: string;
  userId: string;
  reaction: CampusPostReactionType;
}> = [
  {
    postId: "88888888-8888-8888-8888-888888880001",
    userId: "33333333-3333-3333-3333-333333330001",
    reaction: "like",
  },
];

let IN_MEMORY_COMMENTS: CampusPostComment[] = [...INITIAL_MOCK_COMMENTS];

// ==============================================================================
// Cursor & Pagination Helpers
// ==============================================================================

export function encodeCursor(publishedAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ publishedAt, id })).toString("base64");
}

export function decodeCursor(
  cursor?: string
): { publishedAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.publishedAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export interface FeedQueryOptions {
  category?: string;
  query?: string;
  cursor?: string;
  limit?: number;
}

export interface FeedPageResult {
  items: CampusPost[];
  nextCursor: string | null;
  hasMore: boolean;
  count: number;
}

// ==============================================================================
// Service Operations
// ==============================================================================

/**
 * Retrieves the campus information feed for an authenticated user, enforcing visibility,
 * indexed category/search filtering, cursor-based pagination, and batch user reaction resolution.
 */
export async function getFeedPosts(
  userContext: UserAuthContext,
  options?: FeedQueryOptions
): Promise<FeedPageResult> {
  const limit = Math.min(Math.max(1, options?.limit ?? 20), 100);
  const cursorInfo = decodeCursor(options?.cursor);

  let posts: CampusPost[] = [];
  let isDbSuccess = false;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("campus_posts")
      .select("*, campus_post_attachments(*)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("id", { ascending: false });

    if (options?.category && options.category !== "all") {
      query = query.eq("category", options.category);
    }

    if (options?.query && options.query.trim()) {
      const q = options.query.trim();
      query = query.or(
        `title.ilike.%${q}%,content.ilike.%${q}%,author_name.ilike.%${q}%`
      );
    }

    if (cursorInfo) {
      query = query.or(
        `published_at.lt.${cursorInfo.publishedAt},and(published_at.eq.${cursorInfo.publishedAt},id.lt.${cursorInfo.id})`
      );
    }

    // Limit + 1 to detect next page availability
    query = query.limit(limit + 1);

    const { data, error } = await query;

    if (!error && data) {
      isDbSuccess = true;
      posts = data.map((d: any) => ({
        id: d.id,
        authorProfileId: d.author_profile_id,
        authorName: d.author_name,
        authorRole: d.author_role,
        authorRoleCategory: d.author_role_category,
        authorDepartment: d.author_department,
        title: d.title,
        content: d.content,
        category: d.category,
        status: d.status,
        verificationStatus: d.verification_status,
        verificationInfo: d.verifier_name
          ? {
              verifiedByProfileId: d.verified_by_profile_id,
              verifierName: d.verifier_name,
              verifierRole: d.verifier_role,
              verifierDepartment: d.verifier_department,
              verifiedAt: d.verified_at,
              scope: d.verification_scope,
              note: d.verification_note,
            }
          : undefined,
        audience: {
          scope: d.audience_scope,
          departmentCode: d.audience_department_code,
          departmentId: d.audience_department_id,
          programCode: d.audience_program_code,
          academicYear: d.audience_academic_year,
          semester: d.audience_semester,
          section: d.audience_section,
          displayName: d.audience_display_name,
        },
        attachments: (d.campus_post_attachments || []).map((att: any) => ({
          id: att.id,
          storagePath: att.storage_path,
          originalFilename: att.original_filename,
          mimeType: att.mime_type,
          fileSize: Number(att.file_size),
        })),
        likesCount: d.likes_count,
        dislikesCount: d.dislikes_count,
        commentsCount: d.comments_count,
        publishedAt: d.published_at,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
  } catch (_err) {
    // Supabase unavailable / offline mode
  }

  // If DB returned rows, process DB results
  if (isDbSuccess && posts.length > 0) {
    // Enforce server-side audience visibility
    const visiblePosts = posts.filter((p) => isPostVisibleToUser(p, userContext));
    const hasMore = visiblePosts.length > limit;
    const pageItems = hasMore ? visiblePosts.slice(0, limit) : visiblePosts;

    const nextCursor =
      hasMore && pageItems.length > 0
        ? encodeCursor(
            pageItems[pageItems.length - 1].publishedAt,
            pageItems[pageItems.length - 1].id
          )
        : null;

    // Batch resolve user reactions without N+1 queries
    const postIds = pageItems.map((p) => p.id);
    if (postIds.length > 0 && userContext.id) {
      try {
        const supabase = await createClient();
        const { data: userRxns } = await supabase
          .from("campus_post_reactions")
          .select("post_id, reaction_type")
          .in("post_id", postIds)
          .eq("user_profile_id", userContext.id);

        if (userRxns) {
          const rxnMap = new Map(
            userRxns.map((r: any) => [r.post_id, r.reaction_type as CampusPostReactionType])
          );
          pageItems.forEach((p) => {
            p.userReaction = rxnMap.get(p.id) || null;
          });
        }
      } catch {
        // Fallback to in-memory reactions if Supabase lookup fails
        const rxnMap = new Map(
          IN_MEMORY_REACTIONS
            .filter((r) => r.userId === userContext.id && postIds.includes(r.postId))
            .map((r) => [r.postId, r.reaction])
        );
        pageItems.forEach((p) => {
          p.userReaction = rxnMap.get(p.id) || null;
        });
      }
    }

    return {
      items: pageItems,
      nextCursor,
      hasMore,
      count: visiblePosts.length,
    };
  }

  // In-Memory deterministic engine (offline mode / test mode)
  let memoryPosts = [...IN_MEMORY_POSTS];

  // 1. Enforce audience visibility
  memoryPosts = memoryPosts.filter((p) => isPostVisibleToUser(p, userContext));

  // 2. Category filter
  if (options?.category && options.category !== "all") {
    memoryPosts = memoryPosts.filter((p) => p.category === options.category);
  }

  // 3. Search query filter
  if (options?.query && options.query.trim().length > 0) {
    const q = options.query.toLowerCase().trim();
    memoryPosts = memoryPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q)
    );
  }

  // 4. Deterministic sort: publishedAt DESC, then id DESC
  memoryPosts.sort((a, b) => {
    const timeDiff =
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });

  const totalMatchingCount = memoryPosts.length;

  // 5. Cursor filter
  if (cursorInfo) {
    const cursorTime = new Date(cursorInfo.publishedAt).getTime();
    memoryPosts = memoryPosts.filter((p) => {
      const pTime = new Date(p.publishedAt).getTime();
      if (pTime < cursorTime) return true;
      if (pTime === cursorTime) return p.id < cursorInfo.id;
      return false;
    });
  }

  // 6. Slice limit + 1
  const hasMore = memoryPosts.length > limit;
  const pageItems = hasMore ? memoryPosts.slice(0, limit) : memoryPosts;

  const nextCursor =
    hasMore && pageItems.length > 0
      ? encodeCursor(
          pageItems[pageItems.length - 1].publishedAt,
          pageItems[pageItems.length - 1].id
        )
      : null;

  // 7. Batch reaction lookup via Map (O(1) resolution, no N+1)
  const postIds = pageItems.map((p) => p.id);
  const rxnMap = new Map(
    IN_MEMORY_REACTIONS
      .filter((r) => r.userId === userContext.id && postIds.includes(r.postId))
      .map((r) => [r.postId, r.reaction])
  );

  const items = pageItems.map((p) => ({
    ...p,
    userReaction: rxnMap.get(p.id) || null,
  }));

  return {
    items,
    nextCursor,
    hasMore,
    count: totalMatchingCount,
  };
}

/**
 * Retrieves a single post by ID if visible to the user.
 */
export async function getPostById(
  postId: string,
  userContext: UserAuthContext
): Promise<CampusPost | null> {
  const post = IN_MEMORY_POSTS.find((p) => p.id === postId);
  if (!post) return null;

  if (!isPostVisibleToUser(post, userContext)) {
    return null;
  }

  const userRxn = IN_MEMORY_REACTIONS.find(
    (r) => r.postId === post.id && r.userId === userContext.id
  );

  return {
    ...post,
    userReaction: userRxn ? userRxn.reaction : null,
  };
}

/**
 * Creates and publishes a campus post with server authorization checks.
 */
export async function createCampusPost(
  userContext: UserAuthContext,
  request: CreateCampusPostRequest,
  attachments: Array<{
    storagePath: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  }> = []
): Promise<CampusPost> {
  const roleCategory = resolveUserRoleCategory(
    userContext.role,
    userContext.tags
  );

  // 1. Enforce category authorization (regular students cannot publish academic)
  if (!canPublishCategory(roleCategory, request.category)) {
    throw new Error(
      `Role '${roleCategory}' is restricted from publishing academic notices.`
    );
  }

  // 2. Enforce audience authorization
  if (
    !canTargetAudience(
      userContext,
      request.audienceScope,
      request.departmentCode
    )
  ) {
    throw new Error(
      `User is not authorized to target audience scope '${request.audienceScope}'.`
    );
  }

  const generatedId = `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  let audienceDisplayName = "Campus Wide";
  if (request.audienceScope === "students") audienceDisplayName = "All Students";
  if (request.audienceScope === "department")
    audienceDisplayName = `${request.departmentCode || userContext.departmentCode || "Department"} Department`;
  if (request.audienceScope === "class")
    audienceDisplayName = `Year ${request.academicYear || userContext.academicYear || 3} • Sem ${request.semester || userContext.semester || 6} (${request.section || userContext.section || "A"})`;

  const newPost: CampusPost = {
    id: generatedId,
    authorProfileId: userContext.id,
    authorName: userContext.fullName,
    authorRole:
      roleCategory === "student_coordinator"
        ? "Student Coordinator"
        : roleCategory === "department_coordinator"
          ? "Department Coordinator"
          : roleCategory === "faculty"
            ? "Faculty Member"
            : roleCategory === "admin"
              ? "Administrator"
              : "Student",
    authorRoleCategory: roleCategory,
    authorDepartment: userContext.departmentCode || undefined,
    title: request.title,
    content: request.content,
    category: request.category,
    status: "published",
    verificationStatus: "unverified",
    audience: {
      scope: request.audienceScope,
      departmentCode: request.departmentCode || userContext.departmentCode || undefined,
      departmentId: request.departmentId || userContext.departmentId || undefined,
      programCode: request.programCode || userContext.programCode || undefined,
      programId: request.programId || userContext.programId || undefined,
      academicYear: request.academicYear || userContext.academicYear || undefined,
      semester: request.semester || userContext.semester || undefined,
      section: request.section || userContext.section || undefined,
      displayName: audienceDisplayName,
    },
    attachments: attachments.map((att, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      storagePath: att.storagePath,
      originalFilename: att.originalFilename,
      mimeType: att.mimeType,
      fileSize: att.fileSize,
    })),
    likesCount: 0,
    dislikesCount: 0,
    commentsCount: 0,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // Try saving to Supabase if configured
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campus_posts")
      .insert({
        author_profile_id: userContext.id,
        author_name: newPost.authorName,
        author_role: newPost.authorRole,
        author_role_category: newPost.authorRoleCategory,
        author_department: newPost.authorDepartment,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        status: newPost.status,
        verification_status: newPost.verificationStatus,
        audience_scope: newPost.audience.scope,
        audience_department_id: newPost.audience.departmentId,
        audience_department_code: newPost.audience.departmentCode,
        audience_program_id: newPost.audience.programId,
        audience_program_code: newPost.audience.programCode,
        audience_academic_year: newPost.audience.academicYear,
        audience_semester: newPost.audience.semester,
        audience_section: newPost.audience.section,
        audience_display_name: newPost.audience.displayName,
      })
      .select()
      .single();

    if (!error && data) {
      newPost.id = data.id;

      if (attachments.length > 0) {
        await supabase.from("campus_post_attachments").insert(
          attachments.map((att) => ({
            post_id: data.id,
            storage_path: att.storagePath,
            original_filename: att.originalFilename,
            mime_type: att.mimeType,
            file_size: att.fileSize,
          }))
        );
      }
    }
  } catch (_err) {
    // Offline mode
  }

  // Prepend to in-memory store for immediate consistency
  IN_MEMORY_POSTS.unshift(newPost);
  return newPost;
}

/**
 * Verifies a post within authorized coordinator scope.
 */
export async function verifyCampusPost(
  postId: string,
  userContext: UserAuthContext,
  request: VerifyCampusPostRequest
): Promise<CampusPost> {
  const post = IN_MEMORY_POSTS.find((p) => p.id === postId);
  if (!post) {
    throw new Error(`Post with ID '${postId}' not found.`);
  }

  if (!canVerifyPost(userContext, post)) {
    throw new Error(
      "Forbidden: You are not authorized to verify this post (self-verification is blocked, or post is outside your scope)."
    );
  }

  const roleCategory = resolveUserRoleCategory(
    userContext.role,
    userContext.tags
  );

  const verifierRole =
    roleCategory === "department_coordinator"
      ? "Department Coordinator"
      : roleCategory === "student_coordinator"
        ? "Student Coordinator"
        : userContext.role === "admin"
          ? "Administrator"
          : "Faculty Verifier";

  post.verificationStatus = request.status;
  post.verificationInfo = {
    verifiedByProfileId: userContext.id,
    verifierName: userContext.fullName,
    verifierRole,
    verifierRoleCategory: roleCategory,
    verifierDepartment: userContext.departmentCode || undefined,
    verifiedAt: new Date().toISOString(),
    scope: `${userContext.departmentCode || "Campus"} Authority`,
    note: request.note,
  };
  post.updatedAt = new Date().toISOString();

  // Try persisting to Supabase
  try {
    const supabase = await createClient();
    await supabase
      .from("campus_posts")
      .update({
        verification_status: request.status,
        verified_by_profile_id: userContext.id,
        verifier_name: userContext.fullName,
        verifier_role: verifierRole,
        verifier_department: userContext.departmentCode,
        verified_at: post.verificationInfo.verifiedAt,
        verification_scope: post.verificationInfo.scope,
        verification_note: request.note,
      })
      .eq("id", postId);

    await supabase.from("campus_post_verifications").insert({
      post_id: postId,
      verified_by_profile_id: userContext.id,
      verifier_name: userContext.fullName,
      verifier_role: verifierRole,
      verifier_department: userContext.departmentCode,
      status: request.status,
      scope: post.verificationInfo.scope,
      note: request.note,
    });
  } catch (_err) {
    // Offline mode
  }

  return post;
}

/**
 * Toggles or updates a reaction (Like/Dislike) on a post.
 * Mutually exclusive, prevents duplicate counts.
 */
export async function reactToCampusPost(
  postId: string,
  userContext: UserAuthContext,
  reaction: CampusPostReactionType
): Promise<{ likesCount: number; dislikesCount: number; userReaction: CampusPostReactionType | null }> {
  const post = IN_MEMORY_POSTS.find((p) => p.id === postId);
  if (!post) {
    throw new Error(`Post with ID '${postId}' not found.`);
  }

  const existingIndex = IN_MEMORY_REACTIONS.findIndex(
    (r) => r.postId === postId && r.userId === userContext.id
  );

  let nextReaction: CampusPostReactionType | null = reaction;

  if (existingIndex >= 0) {
    const prevReaction = IN_MEMORY_REACTIONS[existingIndex].reaction;
    if (prevReaction === reaction) {
      // Toggle OFF
      IN_MEMORY_REACTIONS.splice(existingIndex, 1);
      nextReaction = null;
      if (reaction === "like") post.likesCount = Math.max(0, post.likesCount - 1);
      if (reaction === "dislike") post.dislikesCount = Math.max(0, post.dislikesCount - 1);
    } else {
      // Switch reaction
      IN_MEMORY_REACTIONS[existingIndex].reaction = reaction;
      if (reaction === "like") {
        post.likesCount += 1;
        post.dislikesCount = Math.max(0, post.dislikesCount - 1);
      } else {
        post.dislikesCount += 1;
        post.likesCount = Math.max(0, post.likesCount - 1);
      }
    }
  } else {
    // Add new reaction
    IN_MEMORY_REACTIONS.push({ postId, userId: userContext.id, reaction });
    if (reaction === "like") post.likesCount += 1;
    if (reaction === "dislike") post.dislikesCount += 1;
  }

  return {
    likesCount: post.likesCount,
    dislikesCount: post.dislikesCount,
    userReaction: nextReaction,
  };
}

/**
 * Retrieves comments for a post if visible to the user.
 */
export async function getCampusPostComments(
  postId: string,
  userContext: UserAuthContext
): Promise<CampusPostComment[]> {
  const post = IN_MEMORY_POSTS.find((p) => p.id === postId);
  if (!post || !isPostVisibleToUser(post, userContext)) {
    throw new Error("Post not found or inaccessible.");
  }

  return IN_MEMORY_COMMENTS.filter(
    (c) => c.postId === postId && c.status === "active"
  );
}

/**
 * Adds a comment to a post.
 */
export async function addCampusPostComment(
  postId: string,
  userContext: UserAuthContext,
  content: string
): Promise<CampusPostComment> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty.");
  }
  if (trimmed.length > 1000) {
    throw new Error("Comment cannot exceed 1000 characters.");
  }

  const post = IN_MEMORY_POSTS.find((p) => p.id === postId);
  if (!post || !isPostVisibleToUser(post, userContext)) {
    throw new Error("Post not found or inaccessible.");
  }

  const roleCategory = resolveUserRoleCategory(
    userContext.role,
    userContext.tags
  );

  const comment: CampusPostComment = {
    id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    postId,
    authorProfileId: userContext.id,
    authorName: userContext.fullName,
    authorRole: userContext.role,
    authorRoleCategory: roleCategory,
    authorDepartment: userContext.departmentCode || undefined,
    content: trimmed,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  IN_MEMORY_COMMENTS.push(comment);
  post.commentsCount += 1;

  return comment;
}

/**
 * Deletes a comment. Only the comment author or an admin can delete a comment.
 */
export async function deleteCampusPostComment(
  commentId: string,
  userContext: UserAuthContext
): Promise<boolean> {
  const comment = IN_MEMORY_COMMENTS.find((c) => c.id === commentId);
  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.authorProfileId !== userContext.id && userContext.role !== "admin") {
    throw new Error("Forbidden: You can only delete your own comments.");
  }

  comment.status = "removed";
  const post = IN_MEMORY_POSTS.find((p) => p.id === comment.postId);
  if (post) {
    post.commentsCount = Math.max(0, post.commentsCount - 1);
  }

  return true;
}
