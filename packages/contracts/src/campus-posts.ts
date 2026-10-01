import { z } from "zod";

// ==============================================================================
// 1. Campus Post Enums
// ==============================================================================

export const CampusPostCategorySchema = z.enum(["academic", "non-academic"]);
export type CampusPostCategory = z.infer<typeof CampusPostCategorySchema>;

export const CampusPostStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
  "removed",
]);
export type CampusPostStatus = z.infer<typeof CampusPostStatusSchema>;

export const CampusPostVerificationStatusSchema = z.enum([
  "unverified",
  "verified",
  "rejected",
]);
export type CampusPostVerificationStatus = z.infer<
  typeof CampusPostVerificationStatusSchema
>;

export const CampusPostAudienceScopeSchema = z.enum([
  "campus",
  "department",
  "program",
  "class",
  "students",
]);
export type CampusPostAudienceScope = z.infer<
  typeof CampusPostAudienceScopeSchema
>;

export const UserRoleCategorySchema = z.enum([
  "regular_student",
  "student_coordinator",
  "department_coordinator",
  "faculty",
  "admin",
]);
export type UserRoleCategory = z.infer<typeof UserRoleCategorySchema>;

export const CampusPostReactionTypeSchema = z.enum(["like", "dislike"]);
export type CampusPostReactionType = z.infer<
  typeof CampusPostReactionTypeSchema
>;

// ==============================================================================
// 2. Audience Target & Attachment Schemas
// ==============================================================================

export const CampusPostAudienceTargetSchema = z.object({
  scope: CampusPostAudienceScopeSchema,
  departmentCode: z.string().optional(),
  departmentName: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  programCode: z.string().optional(),
  programName: z.string().optional(),
  programId: z.string().uuid().optional(),
  classId: z.string().optional(),
  academicYear: z.number().int().optional(),
  semester: z.number().int().optional(),
  section: z.string().optional(),
  displayName: z.string().optional(),
});
export type CampusPostAudienceTarget = z.infer<
  typeof CampusPostAudienceTargetSchema
>;

export const CampusPostAttachmentSchema = z.object({
  id: z.string(),
  storagePath: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().nonnegative(),
  downloadUrl: z.string().optional(),
});
export type CampusPostAttachment = z.infer<typeof CampusPostAttachmentSchema>;

// ==============================================================================
// 3. Comment & Verification Record Schemas
// ==============================================================================

export const CampusPostCommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  authorProfileId: z.string(),
  authorName: z.string(),
  authorRole: stringOrUndefined(z.string()),
  authorRoleCategory: UserRoleCategorySchema.optional(),
  authorDepartment: z.string().optional(),
  content: z.string().min(1).max(1000),
  status: z.enum(["active", "removed"]).default("active"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CampusPostComment = z.infer<typeof CampusPostCommentSchema>;

function stringOrUndefined(schema: z.ZodString) {
  return schema.optional().default("student");
}

export const CampusPostVerificationInfoSchema = z.object({
  verifiedByProfileId: z.string().optional(),
  verifierName: z.string(),
  verifierRole: z.string(),
  verifierRoleCategory: UserRoleCategorySchema.optional(),
  verifierDepartment: z.string().optional(),
  verifiedAt: z.string(),
  scope: z.string(),
  note: z.string().optional(),
});
export type CampusPostVerificationInfo = z.infer<
  typeof CampusPostVerificationInfoSchema
>;

// ==============================================================================
// 4. Canonical Campus Post Schema
// ==============================================================================

export const CampusPostSchema = z.object({
  id: z.string(),
  authorProfileId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  authorRoleCategory: UserRoleCategorySchema,
  authorDepartment: z.string().optional(),
  title: z.string().min(3).max(160),
  content: z.string().min(10).max(5000),
  category: CampusPostCategorySchema,
  status: CampusPostStatusSchema.default("published"),
  verificationStatus: CampusPostVerificationStatusSchema.default("unverified"),
  verificationInfo: CampusPostVerificationInfoSchema.optional(),
  audience: CampusPostAudienceTargetSchema,
  attachments: z.array(CampusPostAttachmentSchema).default([]),
  likesCount: z.number().int().nonnegative().default(0),
  dislikesCount: z.number().int().nonnegative().default(0),
  commentsCount: z.number().int().nonnegative().default(0),
  userReaction: CampusPostReactionTypeSchema.nullable().optional(),
  publishedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CampusPost = z.infer<typeof CampusPostSchema>;

// ==============================================================================
// 5. Request & Response Contracts
// ==============================================================================

export const CreateCampusPostRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(160, "Title must be at most 160 characters"),
  content: z
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content must not exceed 5000 characters"),
  category: CampusPostCategorySchema,
  audienceScope: CampusPostAudienceScopeSchema,
  departmentCode: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  programCode: z.string().optional(),
  programId: z.string().uuid().optional(),
  academicYear: z.number().int().min(1).max(6).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  section: z.string().max(5).optional(),
});
export type CreateCampusPostRequest = z.infer<
  typeof CreateCampusPostRequestSchema
>;

export const VerifyCampusPostRequestSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  note: z.string().max(500).optional(),
});
export type VerifyCampusPostRequest = z.infer<
  typeof VerifyCampusPostRequestSchema
>;

export const ReactCampusPostRequestSchema = z.object({
  reaction: CampusPostReactionTypeSchema,
});
export type ReactCampusPostRequest = z.infer<
  typeof ReactCampusPostRequestSchema
>;

export const CreateCampusPostCommentRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
});
export type CreateCampusPostCommentRequest = z.infer<
  typeof CreateCampusPostCommentRequestSchema
>;
