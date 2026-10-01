import { z } from "zod";

// ==============================================================================
// 1. Enums: Roles & Institutional Responsibility Tags
// ==============================================================================

export const InstitutionalRoleSchema = z.enum([
  "student",
  "faculty",
  "staff",
  "admin",
]);
export type InstitutionalRole = z.infer<typeof InstitutionalRoleSchema>;

export const InstitutionalTagSchema = z.enum([
  "CAS_COORDINATOR",
  "DEPARTMENT_COORDINATOR",
  "COURSE_COORDINATOR",
  "CLASS_COORDINATOR",
  "HOD",
]);
export type InstitutionalTag = z.infer<typeof InstitutionalTagSchema>;

// ==============================================================================
// 2. Department & Program Schemas
// ==============================================================================

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  isActive: z.boolean().default(true),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const ProgramSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  degree: z.string().min(2),
  departmentId: z.string().uuid(),
  durationYears: z.number().int().positive(),
  isActive: z.boolean().default(true),
});
export type Program = z.infer<typeof ProgramSchema>;

// ==============================================================================
// 3. Biodata Schemas
// ==============================================================================

export const StudentBiodataSchema = z.object({
  id: z.string().uuid(),
  institutionalUserId: z.string().uuid(),
  programId: z.string().uuid(),
  departmentId: z.string().uuid(),
  admissionYear: z.number().int(),
  graduationYear: z.number().int(),
  academicYear: z.number().int().min(1).max(6),
  currentSemester: z.number().int().min(1).max(12),
  section: z.string(),
});
export type StudentBiodata = z.infer<typeof StudentBiodataSchema>;

export const FacultyBiodataSchema = z.object({
  id: z.string().uuid(),
  institutionalUserId: z.string().uuid(),
  departmentId: z.string().uuid(),
  designation: z.string(),
  joiningYear: z.number().int(),
});
export type FacultyBiodata = z.infer<typeof FacultyBiodataSchema>;

// ==============================================================================
// 4. Institutional User Master Schema
// ==============================================================================

export const InstitutionalUserSchema = z.object({
  id: z.string().uuid(),
  institutionalId: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  primaryRole: InstitutionalRoleSchema,
  isActive: z.boolean(),
  linkedProfileId: z.string().uuid().nullable().optional(),
  tags: z.array(InstitutionalTagSchema).default([]),
});
export type InstitutionalUser = z.infer<typeof InstitutionalUserSchema>;

// ==============================================================================
// 5. Institutional Identity Lookup & Authentication Schemas
// ==============================================================================

export const InstitutionalLookupRequestSchema = z.object({
  institutionalId: z
    .string()
    .trim()
    .min(3, "Institutional ID must be at least 3 characters")
    .max(30, "Institutional ID must be at most 30 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Institutional ID must contain only alphanumeric characters, dashes, or underscores"),
});
export type InstitutionalLookupRequest = z.infer<typeof InstitutionalLookupRequestSchema>;

export const InstitutionalLookupResponseSchema = z.object({
  id: z.string().uuid(),
  institutionalId: z.string(),
  fullName: z.string(),
  maskedPhone: z.string(),
  role: InstitutionalRoleSchema,
  departmentCode: z.string().nullable().optional(),
  departmentName: z.string().nullable().optional(),
  programCode: z.string().nullable().optional(),
  programName: z.string().nullable().optional(),
  academicYear: z.number().nullable().optional(),
  semester: z.number().nullable().optional(),
  section: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  tags: z.array(InstitutionalTagSchema).default([]),
  isActive: z.boolean(),
});
export type InstitutionalLookupResponse = z.infer<typeof InstitutionalLookupResponseSchema>;

// ==============================================================================
// 6. OTP Challenge & Verification Schemas
// ==============================================================================

export const RequestOtpRequestSchema = z.object({
  institutionalId: z
    .string()
    .trim()
    .min(3, "Institutional ID must be at least 3 characters")
    .max(30, "Institutional ID must be at most 30 characters"),
});
export type RequestOtpRequest = z.infer<typeof RequestOtpRequestSchema>;

export const RequestOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  institutionalId: z.string(),
  maskedPhone: z.string(),
  expiresInSeconds: z.number().int().positive(),
  mockOtp: z.string().optional(),
});
export type RequestOtpResponse = z.infer<typeof RequestOtpResponseSchema>;

export const VerifyOtpRequestSchema = z.object({
  institutionalId: z
    .string()
    .trim()
    .min(3, "Institutional ID must be at least 3 characters")
    .max(30, "Institutional ID must be at most 30 characters"),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must consist of 6 digits"),
});
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

export const VerifyOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  profile: InstitutionalLookupResponseSchema.optional(),
  sessionToken: z.string().optional(),
});
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;
