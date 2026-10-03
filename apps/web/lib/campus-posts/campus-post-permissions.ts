import {
  CampusPost,
  CampusPostCategory,
  CampusPostAudienceScope,
  UserRoleCategory,
} from "@smart-campus/contracts";

export interface UserAuthContext {
  id: string;
  role: string;
  fullName: string;
  institutionalId: string;
  departmentCode?: string | null;
  departmentId?: string | null;
  programCode?: string | null;
  programId?: string | null;
  academicYear?: number | null;
  semester?: number | null;
  section?: string | null;
  tags?: string[];
}

/**
 * Resolves the functional user role category from the institutional role and responsibility tags.
 * Preserves the existing role + responsibility tags architecture without creating a secondary user system.
 */
export function resolveUserRoleCategory(
  role: string,
  tags: string[] = []
): UserRoleCategory {
  if (role === "admin") {
    return "admin";
  }

  if (tags.includes("DEPARTMENT_COORDINATOR") || tags.includes("HOD")) {
    return "department_coordinator";
  }

  if (role === "faculty") {
    return "faculty";
  }

  if (
    role === "student" &&
    tags.some((t) =>
      ["CAS_COORDINATOR", "CLASS_COORDINATOR", "COURSE_COORDINATOR"].includes(t)
    )
  ) {
    return "student_coordinator";
  }

  return "regular_student";
}

/**
 * Checks if a user category is authorized to publish a given post category.
 * Regular students CANNOT publish academic content (only non-academic).
 */
export function canPublishCategory(
  roleCategory: UserRoleCategory,
  category: CampusPostCategory
): boolean {
  if (roleCategory === "regular_student" && category === "academic") {
    return false;
  }
  return true;
}

/**
 * Checks if a user is authorized to target a specified audience scope.
 * Regular students cannot target campus-wide notices or arbitrary departments.
 */
export function canTargetAudience(
  userContext: UserAuthContext,
  audienceScope: CampusPostAudienceScope,
  targetDepartmentCode?: string | null
): boolean {
  const roleCategory = resolveUserRoleCategory(
    userContext.role,
    userContext.tags
  );

  if (roleCategory === "admin") {
    return true;
  }

  if (roleCategory === "regular_student") {
    // Regular students can only post to general student audience or their own class
    return audienceScope === "students" || audienceScope === "class";
  }

  if (roleCategory === "student_coordinator") {
    if (audienceScope === "campus" || audienceScope === "students") {
      return true;
    }
    if (audienceScope === "department") {
      // Must match their own department
      return (
        !targetDepartmentCode ||
        targetDepartmentCode.toUpperCase() ===
          userContext.departmentCode?.toUpperCase()
      );
    }
    return true;
  }

  if (roleCategory === "department_coordinator") {
    if (audienceScope === "campus" || audienceScope === "students") {
      return true;
    }
    if (audienceScope === "department") {
      // Must match their authorized department
      return (
        !targetDepartmentCode ||
        targetDepartmentCode.toUpperCase() ===
          userContext.departmentCode?.toUpperCase()
      );
    }
    return true;
  }

  return true;
}

/**
 * Checks if a user is authorized to verify a post.
 * - Self-verification is strictly prohibited.
 * - Regular students cannot verify posts.
 * - Coordinators can only verify posts within their authorized department/scope.
 * - Admins can verify all posts.
 */
export function canVerifyPost(
  userContext: UserAuthContext,
  post: {
    authorProfileId: string;
    authorDepartment?: string | null;
    audience: {
      scope: CampusPostAudienceScope;
      departmentCode?: string | null;
    };
  }
): boolean {
  // Prohibit self-verification
  if (userContext.id === post.authorProfileId) {
    return false;
  }

  const roleCategory = resolveUserRoleCategory(
    userContext.role,
    userContext.tags
  );

  // Regular students cannot verify
  if (roleCategory === "regular_student") {
    return false;
  }

  // Admins can verify anything
  if (roleCategory === "admin") {
    return true;
  }

  const userDept = userContext.departmentCode?.toUpperCase();
  const postTargetDept = post.audience.departmentCode?.toUpperCase();
  const postAuthorDept = post.authorDepartment?.toUpperCase();

  // If the post targets a specific department, verifier must belong to that department
  if (post.audience.scope === "department" && postTargetDept) {
    return userDept === postTargetDept;
  }

  // If the post is campus/students, verifier can verify if the author belongs to their department
  if (postAuthorDept && userDept) {
    return userDept === postAuthorDept;
  }

  // Department coordinators can verify department notices
  if (roleCategory === "department_coordinator" && userDept) {
    return userDept === postTargetDept || userDept === postAuthorDept;
  }

  return false;
}

/**
 * Checks whether a post is visible to a specific authenticated user.
 */
export function isPostVisibleToUser(
  post: CampusPost,
  userContext: UserAuthContext
): boolean {
  // Author can always see their own post
  if (post.authorProfileId === userContext.id) {
    return true;
  }

  // Admins can see all published posts
  if (userContext.role === "admin") {
    return true;
  }

  const { scope, departmentCode, academicYear, semester, section } =
    post.audience;

  if (scope === "campus" || scope === "students") {
    return true;
  }

  if (scope === "department") {
    return (
      departmentCode?.toUpperCase() ===
      userContext.departmentCode?.toUpperCase()
    );
  }

  if (scope === "class") {
    const matchesYear =
      academicYear === undefined || academicYear === userContext.academicYear;
    const matchesSem =
      semester === undefined || semester === userContext.semester;
    const matchesSection =
      section === undefined || section === userContext.section;
    return matchesYear && matchesSem && matchesSection;
  }

  return true;
}
