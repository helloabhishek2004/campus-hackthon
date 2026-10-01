import { describe, it, expect } from "vitest";
import {
  CampusPostSchema,
  CreateCampusPostRequestSchema,
  CreateCampusPostCommentRequestSchema,
  ReactCampusPostRequestSchema,
  CampusPostFeedQuerySchema,
  CampusPostFeedResponseSchema,
} from "../src/campus-posts";

describe("Campus Post Contracts Validation", () => {
  it("validates a canonical CampusPost object", () => {
    const post = {
      id: "post-001",
      authorProfileId: "33333333-3333-3333-3333-333333330001",
      authorName: "Aarav Sharma",
      authorRole: "Student Coordinator",
      authorRoleCategory: "student_coordinator",
      authorDepartment: "CSE",
      title: "Annual Hackathon 2026 Registration Open",
      content: "Join us for 36 hours of non-stop building, mentoring, and prizes.",
      category: "non-academic",
      status: "published",
      verificationStatus: "verified",
      verificationInfo: {
        verifierName: "Dr. Priya Nair",
        verifierRole: "Department Coordinator",
        verifierRoleCategory: "department_coordinator",
        verifierDepartment: "CSE",
        verifiedAt: "2026-10-01T10:00:00Z",
        scope: "CSE Department",
      },
      audience: {
        scope: "campus",
        displayName: "Entire Campus",
      },
      attachments: [],
      likesCount: 12,
      dislikesCount: 1,
      commentsCount: 3,
      publishedAt: "2026-10-01T09:00:00Z",
      createdAt: "2026-10-01T09:00:00Z",
      updatedAt: "2026-10-01T09:00:00Z",
    };

    const parsed = CampusPostSchema.safeParse(post);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Annual Hackathon 2026 Registration Open");
      expect(parsed.data.category).toBe("non-academic");
      expect(parsed.data.verificationStatus).toBe("verified");
    }
  });

  it("validates CreateCampusPostRequest", () => {
    const req = {
      title: "Campus Photography Club Exhibition",
      content: "Submit your high-resolution campus photos before Friday 5 PM.",
      category: "non-academic",
      audienceScope: "students",
    };

    const parsed = CreateCampusPostRequestSchema.safeParse(req);
    expect(parsed.success).toBe(true);
  });

  it("rejects CreateCampusPostRequest with too short title or content", () => {
    const shortTitle = {
      title: "Hi",
      content: "Valid long content for the post.",
      category: "non-academic",
      audienceScope: "students",
    };
    expect(CreateCampusPostRequestSchema.safeParse(shortTitle).success).toBe(false);

    const shortContent = {
      title: "Valid Title",
      content: "Short",
      category: "non-academic",
      audienceScope: "students",
    };
    expect(CreateCampusPostRequestSchema.safeParse(shortContent).success).toBe(false);
  });

  it("validates comment payload limits", () => {
    expect(
      CreateCampusPostCommentRequestSchema.safeParse({ content: "Great initiative!" })
        .success
    ).toBe(true);

    // Empty comment rejected
    expect(
      CreateCampusPostCommentRequestSchema.safeParse({ content: "   " }).success
    ).toBe(false);

    // Oversized comment (>1000 chars) rejected
    expect(
      CreateCampusPostCommentRequestSchema.safeParse({
        content: "a".repeat(1001),
      }).success
    ).toBe(false);
  });

  it("validates reaction type", () => {
    expect(ReactCampusPostRequestSchema.safeParse({ reaction: "like" }).success).toBe(true);
    expect(ReactCampusPostRequestSchema.safeParse({ reaction: "dislike" }).success).toBe(true);
    expect(ReactCampusPostRequestSchema.safeParse({ reaction: "love" }).success).toBe(false);
  });

  it("validates feed query and feed response schemas", () => {
    const defaultQuery = CampusPostFeedQuerySchema.parse({});
    expect(defaultQuery.limit).toBe(20);
    expect(defaultQuery.category).toBe("all");
    expect(defaultQuery.cursor).toBeUndefined();

    const customQuery = CampusPostFeedQuerySchema.parse({
      limit: "15",
      category: "academic",
      search: "midterm",
      cursor: "eyJwdWJsaXNoZWRBdCI6IjIwMjYtMTAtMDEifQ==",
    });
    expect(customQuery.limit).toBe(15);
    expect(customQuery.category).toBe("academic");
    expect(customQuery.search).toBe("midterm");
    expect(customQuery.cursor).toBeDefined();

    const response = {
      items: [],
      nextCursor: "next-page-token",
      hasMore: true,
      count: 0,
    };
    expect(CampusPostFeedResponseSchema.safeParse(response).success).toBe(true);
  });
});

