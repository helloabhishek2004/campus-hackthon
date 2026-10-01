import { z } from "zod";

// ==============================================================================
// 1. Document Enums
// ==============================================================================

export const DocumentCategorySchema = z.enum(["academic", "non-academic"]);
export type DocumentCategory = z.infer<typeof DocumentCategorySchema>;

export const DocumentStatusSchema = z.enum([
  "Active",
  "Available",
  "Verified",
  "Approved",
  "Ready",
  "Pending Verification",
  "Rejected",
]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const DocumentStatusVariantSchema = z.enum([
  "success",
  "default",
  "secondary",
  "warning",
  "destructive",
]);
export type DocumentStatusVariant = z.infer<typeof DocumentStatusVariantSchema>;

export const DocumentIconNameSchema = z.enum([
  "id-card",
  "award",
  "file-text",
  "calendar-check",
  "book-open",
  "shield-check",
  "bus",
  "home",
  "users",
  "activity",
  "key",
]);
export type DocumentIconName = z.infer<typeof DocumentIconNameSchema>;

// ==============================================================================
// 2. Document Details & Metadata
// ==============================================================================

export const DocumentDetailsSchema = z.object({
  issuer: z.string().min(1, "Issuer is required"),
  verifiedBy: z.string().min(1, "Verifier is required"),
  referenceCode: z.string().min(1, "Reference code is required"),
  remarks: z.string().optional(),
});
export type DocumentDetails = z.infer<typeof DocumentDetailsSchema>;

export const DocumentTypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  category: DocumentCategorySchema,
  description: z.string().optional(),
  allowedRoles: z.array(z.string()).default(["student", "faculty", "staff", "admin"]),
  isUploadable: z.boolean().default(true),
  isGenerated: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// ==============================================================================
// 3. Campus Document Canonical Schema
// ==============================================================================

export const CampusDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  category: DocumentCategorySchema,
  description: z.string(),
  status: DocumentStatusSchema,
  statusVariant: DocumentStatusVariantSchema,
  issuedDate: z.string(),
  documentNumber: z.string(),
  validThrough: z.string().optional(),
  iconName: DocumentIconNameSchema,
  details: DocumentDetailsSchema,
  storagePath: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
  currentVersion: z.number().int().positive().optional(),
  verifiedAt: z.string().nullable().optional(),
  verifiedBy: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  ownerProfileId: z.string().uuid().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type CampusDocument = z.infer<typeof CampusDocumentSchema>;

// ==============================================================================
// 4. Request / Response Contracts
// ==============================================================================

export const CreateDocumentRequestSchema = z.object({
  documentTypeCode: z.string().min(2, "Document type code is required"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().max(500).optional(),
  category: DocumentCategorySchema,
  originalFilename: z.string().min(1).optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().max(10 * 1024 * 1024, "File size must not exceed 10MB").optional(),
  issuedDate: z.string().optional(),
  validThrough: z.string().optional(),
  remarks: z.string().max(500).optional(),
});
export type CreateDocumentRequest = z.infer<typeof CreateDocumentRequestSchema>;

export const DocumentDownloadResponseSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  downloadUrl: z.string().url().or(z.string().startsWith("blob:")).or(z.string().startsWith("data:")),
  fileName: z.string(),
  mimeType: z.string(),
  expiresInSeconds: z.number().int().positive(),
  isMock: z.boolean().default(false),
});
export type DocumentDownloadResponse = z.infer<typeof DocumentDownloadResponseSchema>;

export const DocumentUploadResponseSchema = z.object({
  success: z.boolean(),
  document: CampusDocumentSchema,
  message: z.string(),
});
export type DocumentUploadResponse = z.infer<typeof DocumentUploadResponseSchema>;
