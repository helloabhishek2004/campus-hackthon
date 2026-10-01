import { z } from "zod";

// ==============================================================================
// 1. Academic Document Types & Enums
// ==============================================================================

export const AcademicDocumentTypeSchema = z.enum([
  "Academic Notice",
  "Assignment",
  "Assessment Notice",
  "Exam Schedule",
  "Class Schedule",
  "Course Material",
  "Syllabus / Curriculum",
  "Workshop / Seminar Notice",
  "Attendance Notice",
  "Academic Circular",
  "Department Notice",
  "Course Announcement",
  "Meeting Notice",
  "Academic Reminder",
  "Other Academic Document",
]);
export type AcademicDocumentType = z.infer<typeof AcademicDocumentTypeSchema>;

export const AcademicDocumentPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);
export type AcademicDocumentPriority = z.infer<
  typeof AcademicDocumentPrioritySchema
>;

export const AcademicDocumentStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "DELIVERED",
  "READ",
  "ARCHIVED",
]);
export type AcademicDocumentStatus = z.infer<
  typeof AcademicDocumentStatusSchema
>;

export const StudentSubmissionStatusSchema = z.enum([
  "SUBMITTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "RETURNED",
  "ARCHIVED",
]);
export type StudentSubmissionStatus = z.infer<
  typeof StudentSubmissionStatusSchema
>;

export const AcademicTargetScopeSchema = z.enum([
  "class",
  "course",
  "program",
  "department",
  "faculty",
  "cross_department",
  "campus",
]);
export type AcademicTargetScope = z.infer<typeof AcademicTargetScopeSchema>;

export const FacultyAssignmentTypeSchema = z.enum([
  "department",
  "program",
  "class",
  "course",
]);
export type FacultyAssignmentType = z.infer<
  typeof FacultyAssignmentTypeSchema
>;

// ==============================================================================
// 2. Course & Assignment Schemas
// ==============================================================================

export const CourseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  departmentId: z.string().uuid(),
  departmentCode: z.string().optional(),
  programId: z.string().uuid(),
  programCode: z.string().optional(),
  semester: z.number().int().min(1).max(12),
  credits: z.number().int().positive().default(4),
  isActive: z.boolean().default(true),
});
export type Course = z.infer<typeof CourseSchema>;

export const FacultyAcademicAssignmentSchema = z.object({
  id: z.string().uuid(),
  facultyInstitutionalUserId: z.string().uuid(),
  assignmentType: FacultyAssignmentTypeSchema,
  departmentId: z.string().uuid().optional(),
  departmentCode: z.string().optional(),
  programId: z.string().uuid().optional(),
  programCode: z.string().optional(),
  academicYear: z.number().int().optional(),
  semester: z.number().int().optional(),
  section: z.string().optional(),
  courseId: z.string().uuid().optional(),
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  roleTitle: z.string(),
  academicSession: z.string().default("2025-2026"),
  isActive: z.boolean().default(true),
});
export type FacultyAcademicAssignment = z.infer<
  typeof FacultyAcademicAssignmentSchema
>;

// ==============================================================================
// 3. Authorized Scope & Target Schemas
// ==============================================================================

export const FacultyAuthorizedScopeItemSchema = z.object({
  id: z.string(),
  scope: AcademicTargetScopeSchema,
  displayName: z.string(),
  description: z.string(),
  estimatedRecipients: z.number().int().nonnegative(),
  departmentId: z.string().uuid().optional(),
  departmentCode: z.string().optional(),
  programId: z.string().uuid().optional(),
  programCode: z.string().optional(),
  academicYear: z.number().int().optional(),
  semester: z.number().int().optional(),
  section: z.string().optional(),
  courseId: z.string().uuid().optional(),
  courseName: z.string().optional(),
});
export type FacultyAuthorizedScopeItem = z.infer<
  typeof FacultyAuthorizedScopeItemSchema
>;

export const AcademicDocumentAttachmentSchema = z.object({
  id: z.string(),
  storagePath: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().nonnegative(),
  downloadUrl: z.string().optional(),
});
export type AcademicDocumentAttachment = z.infer<
  typeof AcademicDocumentAttachmentSchema
>;

// ==============================================================================
// 4. Canonical Academic Document Schema
// ==============================================================================

export const AcademicDocumentSchema = z.object({
  id: z.string(),
  senderProfileId: z.string(),
  senderInstitutionalUserId: z.string().optional(),
  senderName: z.string(),
  senderRole: z.string(),
  senderDepartment: z.string().optional(),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
  documentType: AcademicDocumentTypeSchema,
  priority: AcademicDocumentPrioritySchema.default("normal"),
  deadline: z.string().optional(),
  status: AcademicDocumentStatusSchema.default("SENT"),
  targetScope: AcademicTargetScopeSchema,
  targetDepartmentId: z.string().uuid().optional(),
  targetDepartmentCode: z.string().optional(),
  targetProgramId: z.string().uuid().optional(),
  targetProgramCode: z.string().optional(),
  targetAcademicYear: z.number().int().optional(),
  targetSemester: z.number().int().optional(),
  targetSection: z.string().optional(),
  targetCourseId: z.string().uuid().optional(),
  targetCourseName: z.string().optional(),
  targetDisplayName: z.string(),
  deliveryCount: z.number().int().nonnegative().default(0),
  readCount: z.number().int().nonnegative().default(0),
  isRead: z.boolean().optional(), // In the context of the logged-in recipient
  readAt: z.string().optional(),
  attachments: z.array(AcademicDocumentAttachmentSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AcademicDocument = z.infer<typeof AcademicDocumentSchema>;

// ==============================================================================
// 5. Request & Response Schemas
// ==============================================================================

export const CreateAcademicDocumentRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  content: z
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must not exceed 10000 characters"),
  documentType: AcademicDocumentTypeSchema,
  priority: AcademicDocumentPrioritySchema.default("normal"),
  deadline: z.string().optional(),
  targetScope: AcademicTargetScopeSchema,
  targetDepartmentCode: z.string().optional(),
  targetDepartmentId: z.string().uuid().optional(),
  targetProgramCode: z.string().optional(),
  targetProgramId: z.string().uuid().optional(),
  targetAcademicYear: z.number().int().min(1).max(6).optional(),
  targetSemester: z.number().int().min(1).max(12).optional(),
  targetSection: z.string().max(5).optional(),
  targetCourseId: z.string().uuid().optional(),
  targetCourseName: z.string().optional(),
});
export type CreateAcademicDocumentRequest = z.infer<
  typeof CreateAcademicDocumentRequestSchema
>;

export const FacultyDocumentQuerySchema = z.object({
  tab: z.enum(["received", "sent"]).default("received"),
  filter: z.string().optional().default("all"),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type FacultyDocumentQuery = z.infer<typeof FacultyDocumentQuerySchema>;
export type FacultyDocumentQueryInput = z.input<typeof FacultyDocumentQuerySchema>;

export const FacultyDocumentResponseSchema = z.object({
  items: z.array(AcademicDocumentSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  count: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative().optional(),
});
export type FacultyDocumentResponse = z.infer<
  typeof FacultyDocumentResponseSchema
>;

export const FacultyDashboardOverviewSchema = z.object({
  unreadDocumentsCount: z.number().int().nonnegative(),
  sentDocumentsCount: z.number().int().nonnegative(),
  pendingSubmissionsCount: z.number().int().nonnegative(),
  assignedClassesCount: z.number().int().nonnegative(),
  assignedCoursesCount: z.number().int().nonnegative(),
  recentReceived: z.array(AcademicDocumentSchema),
  recentSent: z.array(AcademicDocumentSchema),
  assignments: z.array(FacultyAcademicAssignmentSchema),
});
export type FacultyDashboardOverview = z.infer<
  typeof FacultyDashboardOverviewSchema
>;

export const ReviewStudentSubmissionRequestSchema = z.object({
  status: z.enum(["ACCEPTED", "RETURNED", "UNDER_REVIEW"]),
  remarks: z.string().max(500).optional(),
});
export type ReviewStudentSubmissionRequest = z.infer<
  typeof ReviewStudentSubmissionRequestSchema
>;
