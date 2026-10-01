import {
  CampusPost,
  CampusPostComment,
  CampusPostReactionType,
  CreateCampusPostRequest,
} from "@smart-campus/contracts";
import { getMockSession } from "../auth/client-session";

export const campusPostsClientService = {
  /**
   * Fetches posts visible to the authenticated session user.
   */
  async getFeed(options?: {
    category?: "all" | "academic" | "non-academic";
    query?: string;
  }): Promise<CampusPost[]> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    const params = new URLSearchParams();
    if (options?.category && options.category !== "all") {
      params.set("category", options.category);
    }
    if (options?.query && options.query.trim()) {
      params.set("q", options.query.trim());
    }

    const url = `/api/campus-posts${params.toString() ? `?${params.toString()}` : ""}`;

    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.posts && Array.isArray(data.posts)) {
          return data.posts;
        }
      }
    } catch (_err) {
      // Offline fallback
    }

    return [];
  },

  /**
   * Publishes a new campus post.
   */
  async createPost(
    request: CreateCampusPostRequest,
    file?: File | null
  ): Promise<{ success: boolean; post?: CampusPost; error?: string }> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      let body: BodyInit;
      if (file) {
        const formData = new FormData();
        formData.append("title", request.title);
        formData.append("content", request.content);
        formData.append("category", request.category);
        formData.append("audienceScope", request.audienceScope);
        if (request.departmentCode)
          formData.append("departmentCode", request.departmentCode);
        if (request.programCode)
          formData.append("programCode", request.programCode);
        if (request.academicYear)
          formData.append("academicYear", String(request.academicYear));
        if (request.semester)
          formData.append("semester", String(request.semester));
        if (request.section) formData.append("section", request.section);
        formData.append("file", file);
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(request);
      }

      const res = await fetch("/api/campus-posts", {
        method: "POST",
        headers,
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to create post." };
      }

      return { success: true, post: data.post };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error publishing post.",
      };
    }
  },

  /**
   * Verifies or rejects a post.
   */
  async verifyPost(
    postId: string,
    status: "verified" | "rejected",
    note?: string
  ): Promise<{ success: boolean; post?: CampusPost; error?: string }> {
    const session = getMockSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch(`/api/campus-posts/${postId}/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status, note }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to verify post." };
      }

      return { success: true, post: data.post };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error verifying post.",
      };
    }
  },

  /**
   * Toggles Like/Dislike reaction on a post.
   */
  async react(
    postId: string,
    reaction: CampusPostReactionType
  ): Promise<{
    likesCount: number;
    dislikesCount: number;
    userReaction: CampusPostReactionType | null;
  } | null> {
    const session = getMockSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch(`/api/campus-posts/${postId}/reaction`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reaction }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (_err) {
      // Offline fallback
    }

    return null;
  },

  /**
   * Fetches comments for a post.
   */
  async getComments(postId: string): Promise<CampusPostComment[]> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch(`/api/campus-posts/${postId}/comments`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        return data.comments || [];
      }
    } catch (_err) {
      // Offline fallback
    }

    return [];
  },

  /**
   * Adds a comment to a post.
   */
  async addComment(
    postId: string,
    content: string
  ): Promise<{ success: boolean; comment?: CampusPostComment; error?: string }> {
    const session = getMockSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch(`/api/campus-posts/${postId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to add comment." };
      }

      return { success: true, comment: data.comment };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error posting comment.",
      };
    }
  },

  /**
   * Deletes a comment.
   */
  async deleteComment(
    postId: string,
    commentId: string
  ): Promise<boolean> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch(
        `/api/campus-posts/${postId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers,
        }
      );
      return res.ok;
    } catch (_err) {
      return false;
    }
  },
};
