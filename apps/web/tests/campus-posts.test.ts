import { describe, it, expect } from "vitest";
import {
  resolveUserRoleCategory,
  canPublishCategory,
  canTargetAudience,
  canVerifyPost,
  isPostVisibleToUser,
  UserAuthContext,
} from "../lib/campus-posts/campus-post-permissions";
import {
  createCampusPost,
  verifyCampusPost,
  reactToCampusPost,
  getFeedPosts,
  addCampusPostComment,
  deleteCampusPostComment,
} from "../lib/campus-posts/campus-post-service";

// Test Users Matrix per Section 54
const REGULAR_CSE_STUDENT: UserAuthContext = {
  id: "33333333-3333-3333-3333-333333330002",
  fullName: "Diya Patel",
  institutionalId: "STU2026002",
  role: "student",
  departmentCode: "CSE",
  academicYear: 3,
  semester: 6,
  section: "A",
  tags: [],
};

const REGULAR_ECE_STUDENT: UserAuthContext = {
  id: "33333333-3333-3333-3333-333333330013",
  fullName: "Arjun Gupta",
  institutionalId: "STU2026013",
  role: "student",
  departmentCode: "ECE",
  academicYear: 3,
  semester: 6,
  section: "A",
  tags: [],
};

const CSE_STUDENT_COORDINATOR: UserAuthContext = {
  id: "33333333-3333-3333-3333-333333330001",
  fullName: "Aarav Sharma",
  institutionalId: "STU2026001",
  role: "student",
  departmentCode: "CSE",
  academicYear: 3,
  semester: 6,
  section: "A",
  tags: ["CAS_COORDINATOR"],
};

const ECE_STUDENT_COORDINATOR: UserAuthContext = {
  id: "33333333-3333-3333-3333-333333330012",
  fullName: "Tanvi Reddy",
  institutionalId: "STU2026012",
  role: "student",
  departmentCode: "ECE",
  academicYear: 3,
  semester: 6,
  section: "B",
  tags: ["CAS_COORDINATOR"],
};

const CSE_DEPARTMENT_COORDINATOR: UserAuthContext = {
  id: "44444444-4444-4444-4444-444444440002",
  fullName: "Dr. Priya Nair",
  institutionalId: "FAC2026001",
  role: "faculty",
  departmentCode: "CSE",
  tags: ["DEPARTMENT_COORDINATOR", "CLASS_COORDINATOR"],
};

const ECE_DEPARTMENT_COORDINATOR: UserAuthContext = {
  id: "44444444-4444-4444-4444-444444440005",
  fullName: "Dr. Anita Roy",
  institutionalId: "FAC2026004",
  role: "faculty",
  departmentCode: "ECE",
  tags: ["DEPARTMENT_COORDINATOR", "COURSE_COORDINATOR"],
};

const ADMIN_USER: UserAuthContext = {
  id: "55555555-5555-5555-5555-555555550001",
  fullName: "Office of Registrar",
  institutionalId: "ADM9001",
  role: "admin",
  tags: [],
};

describe("Campus Information Publishing & Security", () => {
  describe("1. Role Category Mapping", () => {
    it("maps regular student with no coordinator tags to regular_student", () => {
      expect(
        resolveUserRoleCategory(
          REGULAR_CSE_STUDENT.role,
          REGULAR_CSE_STUDENT.tags
        )
      ).toBe("regular_student");
      expect(
        resolveUserRoleCategory(
          REGULAR_ECE_STUDENT.role,
          REGULAR_ECE_STUDENT.tags
        )
      ).toBe("regular_student");
    });

    it("maps student with coordinator tag to student_coordinator", () => {
      expect(
        resolveUserRoleCategory(
          CSE_STUDENT_COORDINATOR.role,
          CSE_STUDENT_COORDINATOR.tags
        )
      ).toBe("student_coordinator");
      expect(
        resolveUserRoleCategory(
          ECE_STUDENT_COORDINATOR.role,
          ECE_STUDENT_COORDINATOR.tags
        )
      ).toBe("student_coordinator");
    });

    it("maps user with DEPARTMENT_COORDINATOR tag to department_coordinator", () => {
      expect(
        resolveUserRoleCategory(
          CSE_DEPARTMENT_COORDINATOR.role,
          CSE_DEPARTMENT_COORDINATOR.tags
        )
      ).toBe("department_coordinator");
      expect(
        resolveUserRoleCategory(
          ECE_DEPARTMENT_COORDINATOR.role,
          ECE_DEPARTMENT_COORDINATOR.tags
        )
      ).toBe("department_coordinator");
    });

    it("maps admin role to admin", () => {
      expect(
        resolveUserRoleCategory(ADMIN_USER.role, ADMIN_USER.tags)
      ).toBe("admin");
    });
  });

  describe("2. Publishing Restrictions (Section 55)", () => {
    it("allows regular student to publish non-academic content", () => {
      const cat = resolveUserRoleCategory(
        REGULAR_CSE_STUDENT.role,
        REGULAR_CSE_STUDENT.tags
      );
      expect(canPublishCategory(cat, "non-academic")).toBe(true);
    });

    it("prevents regular student from publishing academic content", () => {
      const cat = resolveUserRoleCategory(
        REGULAR_CSE_STUDENT.role,
        REGULAR_CSE_STUDENT.tags
      );
      expect(canPublishCategory(cat, "academic")).toBe(false);
    });

    it("allows Student Coordinator to publish both academic and non-academic content", () => {
      const cat = resolveUserRoleCategory(
        CSE_STUDENT_COORDINATOR.role,
        CSE_STUDENT_COORDINATOR.tags
      );
      expect(canPublishCategory(cat, "academic")).toBe(true);
      expect(canPublishCategory(cat, "non-academic")).toBe(true);
    });

    it("allows Department Coordinator to publish both academic and non-academic content", () => {
      const cat = resolveUserRoleCategory(
        CSE_DEPARTMENT_COORDINATOR.role,
        CSE_DEPARTMENT_COORDINATOR.tags
      );
      expect(canPublishCategory(cat, "academic")).toBe(true);
      expect(canPublishCategory(cat, "non-academic")).toBe(true);
    });

    it("blocks regular student from creating academic post via service", async () => {
      await expect(
        createCampusPost(REGULAR_CSE_STUDENT, {
          title: "Exam Schedule Notice",
          content: "Unauthorized academic notice submission attempt.",
          category: "academic",
          audienceScope: "students",
        })
      ).rejects.toThrow("restricted from publishing academic");
    });

    it("blocks regular student from targeting arbitrary department", async () => {
      await expect(
        createCampusPost(REGULAR_CSE_STUDENT, {
          title: "Department Notice",
          content: "Attempting to broadcast to ECE department directly.",
          category: "non-academic",
          audienceScope: "department",
          departmentCode: "ECE",
        })
      ).rejects.toThrow("not authorized to target audience");
    });

    it("allows regular student to publish valid non-academic post", async () => {
      const post = await createCampusPost(REGULAR_CSE_STUDENT, {
        title: "Coding Club Hacknight Announcement",
        content: "Join us for weekly collaborative problem solving.",
        category: "non-academic",
        audienceScope: "students",
      });
      expect(post.id).toBeDefined();
      expect(post.category).toBe("non-academic");
      expect(post.authorRoleCategory).toBe("regular_student");
    });
  });

  describe("3. Audience Targeting & Visibility (Section 15 & 16)", () => {
    it("allows CSE student to see CSE department post", () => {
      const cseDeptPost: any = {
        id: "post-cse-dept",
        authorProfileId: "someone-else",
        audience: { scope: "department", departmentCode: "CSE" },
      };
      expect(isPostVisibleToUser(cseDeptPost, REGULAR_CSE_STUDENT)).toBe(true);
    });

    it("prevents ECE student from seeing CSE department post", () => {
      const cseDeptPost: any = {
        id: "post-cse-dept",
        authorProfileId: "someone-else",
        audience: { scope: "department", departmentCode: "CSE" },
      };
      expect(isPostVisibleToUser(cseDeptPost, REGULAR_ECE_STUDENT)).toBe(false);
    });

    it("allows both CSE and ECE students to see campus-wide posts", () => {
      const campusPost: any = {
        id: "post-campus",
        authorProfileId: "someone-else",
        audience: { scope: "campus" },
      };
      expect(isPostVisibleToUser(campusPost, REGULAR_CSE_STUDENT)).toBe(true);
      expect(isPostVisibleToUser(campusPost, REGULAR_ECE_STUDENT)).toBe(true);
    });
  });

  describe("4. Scoped Verification & Anti-Self-Verification (Section 58)", () => {
    const cseStudentPost = {
      id: "post-cse-01",
      authorProfileId: REGULAR_CSE_STUDENT.id,
      authorDepartment: "CSE",
      audience: { scope: "department" as const, departmentCode: "CSE" },
    };

    const eceStudentPost = {
      id: "post-ece-01",
      authorProfileId: REGULAR_ECE_STUDENT.id,
      authorDepartment: "ECE",
      audience: { scope: "department" as const, departmentCode: "ECE" },
    };

    it("prevents author from verifying their own post (self-verification prohibited)", () => {
      expect(canVerifyPost(REGULAR_CSE_STUDENT, cseStudentPost)).toBe(false);

      const coordSelfPost = {
        id: "post-coord-01",
        authorProfileId: CSE_STUDENT_COORDINATOR.id,
        authorDepartment: "CSE",
        audience: { scope: "department" as const, departmentCode: "CSE" },
      };
      expect(canVerifyPost(CSE_STUDENT_COORDINATOR, coordSelfPost)).toBe(false);
    });

    it("prevents regular student from verifying any post", () => {
      expect(canVerifyPost(REGULAR_CSE_STUDENT, eceStudentPost)).toBe(false);
      expect(canVerifyPost(REGULAR_ECE_STUDENT, cseStudentPost)).toBe(false);
    });

    it("allows CSE Coordinator to verify eligible CSE post", () => {
      expect(canVerifyPost(CSE_STUDENT_COORDINATOR, cseStudentPost)).toBe(true);
      expect(canVerifyPost(CSE_DEPARTMENT_COORDINATOR, cseStudentPost)).toBe(true);
    });

    it("prevents CSE Coordinator from verifying ECE post (cross-department forbidden)", () => {
      expect(canVerifyPost(CSE_STUDENT_COORDINATOR, eceStudentPost)).toBe(false);
      expect(canVerifyPost(CSE_DEPARTMENT_COORDINATOR, eceStudentPost)).toBe(false);
    });

    it("allows Admin to verify posts across all departments", () => {
      expect(canVerifyPost(ADMIN_USER, cseStudentPost)).toBe(true);
      expect(canVerifyPost(ADMIN_USER, eceStudentPost)).toBe(true);
    });

    it("rejects unauthorized verification attempt via service", async () => {
      await expect(
        verifyCampusPost(
          "88888888-8888-8888-8888-888888880004", // ECE post
          CSE_STUDENT_COORDINATOR, // CSE coordinator
          { status: "verified" }
        )
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("5. Reactions & Mutual Exclusivity (Section 56)", () => {
    const targetPostId = "88888888-8888-8888-8888-888888880003";

    it("handles like, toggle off, and switch to dislike", async () => {
      const user = REGULAR_ECE_STUDENT;

      // 1. User clicks Like
      const firstLike = await reactToCampusPost(targetPostId, user, "like");
      expect(firstLike.userReaction).toBe("like");

      // 2. User clicks Like again -> reaction removed
      const unliked = await reactToCampusPost(targetPostId, user, "like");
      expect(unliked.userReaction).toBeNull();

      // 3. User clicks Dislike -> reaction becomes dislike
      const disliked = await reactToCampusPost(targetPostId, user, "dislike");
      expect(disliked.userReaction).toBe("dislike");

      // 4. User clicks Like while disliked -> like replaces dislike (mutual exclusivity)
      const switchedToLike = await reactToCampusPost(targetPostId, user, "like");
      expect(switchedToLike.userReaction).toBe("like");
    });
  });

  describe("6. Comments Lifecycle & Ownership (Section 57)", () => {
    const targetPostId = "88888888-8888-8888-8888-888888880001";

    it("allows authenticated user to comment", async () => {
      const comment = await addCampusPostComment(
        targetPostId,
        REGULAR_CSE_STUDENT,
        "Looking forward to the hardware track!"
      );
      expect(comment.id).toBeDefined();
      expect(comment.content).toBe("Looking forward to the hardware track!");
      expect(comment.authorProfileId).toBe(REGULAR_CSE_STUDENT.id);
    });

    it("rejects empty comments", async () => {
      await expect(
        addCampusPostComment(targetPostId, REGULAR_CSE_STUDENT, "   ")
      ).rejects.toThrow("Comment cannot be empty");
    });

    it("rejects comments exceeding 1000 characters", async () => {
      await expect(
        addCampusPostComment(targetPostId, REGULAR_CSE_STUDENT, "x".repeat(1001))
      ).rejects.toThrow("exceed 1000 characters");
    });

    it("allows author to delete their own comment", async () => {
      const comment = await addCampusPostComment(
        targetPostId,
        REGULAR_CSE_STUDENT,
        "Temporary comment to delete"
      );
      const deleted = await deleteCampusPostComment(comment.id, REGULAR_CSE_STUDENT);
      expect(deleted).toBe(true);
    });

    it("prevents user from deleting another user's comment", async () => {
      const comment = await addCampusPostComment(
        targetPostId,
        REGULAR_CSE_STUDENT,
        "Author comment"
      );
      await expect(
        deleteCampusPostComment(comment.id, REGULAR_ECE_STUDENT)
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("7. Feed Performance, Cursor Pagination & Audience Visibility", () => {
    it("returns paginated feed result with items, nextCursor, hasMore, and count", async () => {
      const result = await getFeedPosts(REGULAR_CSE_STUDENT, { limit: 10 });
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeTruthy();
      expect(result.count).toBeGreaterThan(10);
    });

    it("paginates sequentially without duplicate posts across cursors", async () => {
      const page1 = await getFeedPosts(REGULAR_CSE_STUDENT, { limit: 10 });
      expect(page1.items.length).toBe(10);
      expect(page1.nextCursor).not.toBeNull();

      const page2 = await getFeedPosts(REGULAR_CSE_STUDENT, {
        limit: 10,
        cursor: page1.nextCursor!,
      });
      expect(page2.items.length).toBe(10);

      // Verify no overlap between page 1 and page 2
      const page1Ids = new Set(page1.items.map((p) => p.id));
      for (const post of page2.items) {
        expect(page1Ids.has(post.id)).toBe(false);
      }

      // Verify strict descending order
      const lastPage1Post = page1.items[page1.items.length - 1];
      const firstPage2Post = page2.items[0];
      const time1 = new Date(lastPage1Post.publishedAt).getTime();
      const time2 = new Date(firstPage2Post.publishedAt).getTime();
      expect(time1 >= time2).toBe(true);
    });

    it("filters feed by academic and non-academic categories", async () => {
      const academicFeed = await getFeedPosts(REGULAR_CSE_STUDENT, {
        category: "academic",
        limit: 50,
      });
      expect(academicFeed.items.length).toBeGreaterThan(0);
      academicFeed.items.forEach((p) => {
        expect(p.category).toBe("academic");
      });

      const nonAcademicFeed = await getFeedPosts(REGULAR_CSE_STUDENT, {
        category: "non-academic",
        limit: 50,
      });
      expect(nonAcademicFeed.items.length).toBeGreaterThan(0);
      nonAcademicFeed.items.forEach((p) => {
        expect(p.category).toBe("non-academic");
      });
    });

    it("performs server-side search across title, content, and author", async () => {
      const searchResult = await getFeedPosts(REGULAR_CSE_STUDENT, {
        query: "hackathon",
      });
      expect(searchResult.items.length).toBeGreaterThan(0);
      searchResult.items.forEach((p) => {
        const matches =
          p.title.toLowerCase().includes("hackathon") ||
          p.content.toLowerCase().includes("hackathon") ||
          p.authorName.toLowerCase().includes("hackathon");
        expect(matches).toBe(true);
      });

      const noMatches = await getFeedPosts(REGULAR_CSE_STUDENT, {
        query: "randomnonexistentkeyword999xyz",
      });
      expect(noMatches.items.length).toBe(0);
      expect(noMatches.count).toBe(0);
      expect(noMatches.hasMore).toBe(false);
    });

    it("enforces cross-department isolation: CSE cannot see private ECE posts", async () => {
      const cseFeed = await getFeedPosts(REGULAR_CSE_STUDENT, { limit: 100 });
      const visibleEcePrivatePosts = cseFeed.items.filter(
        (p) =>
          p.audience.scope === "department" &&
          p.audience.departmentCode === "ECE"
      );
      expect(visibleEcePrivatePosts.length).toBe(0);
    });

    it("enforces cross-department isolation: ECE cannot see private CSE posts", async () => {
      const eceFeed = await getFeedPosts(REGULAR_ECE_STUDENT, { limit: 100 });
      const visibleCsePrivatePosts = eceFeed.items.filter(
        (p) =>
          p.audience.scope === "department" &&
          p.audience.departmentCode === "CSE"
      );
      expect(visibleCsePrivatePosts.length).toBe(0);
    });

    it("batch resolves user reactions without error", async () => {
      // First react with like
      const testPostId = "88888888-8888-8888-8888-888888880003";
      await reactToCampusPost(testPostId, REGULAR_CSE_STUDENT, "like");

      const feed = await getFeedPosts(REGULAR_CSE_STUDENT, { limit: 20 });
      const reactedPost = feed.items.find((p) => p.id === testPostId);
      if (reactedPost) {
        expect(reactedPost.userReaction).toBe("like");
      }
    });
  });
});
