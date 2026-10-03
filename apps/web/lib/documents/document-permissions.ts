import { InstitutionalRole } from "@smart-campus/contracts";

export interface DocumentPermissionContext {
  userId: string;
  role: InstitutionalRole;
  departmentCode?: string | null;
  tags?: string[];
}

/**
 * Checks if the user is authorized to upload a specific document type.
 */
export function canUploadDocumentType(
  userRole: InstitutionalRole,
  documentType: {
    code: string;
    allowedRoles: string[];
    isUploadable: boolean;
  }
): boolean {
  if (!documentType.isUploadable) {
    // Only admins can upload non-uploadable (system-generated) documents
    return userRole === "admin";
  }

  // Admins can upload anything
  if (userRole === "admin") {
    return true;
  }

  return documentType.allowedRoles.includes(userRole);
}

/**
 * Checks if the user is authorized to view a specific document.
 */
export function canViewDocument(
  userContext: DocumentPermissionContext,
  document: {
    ownerProfileId?: string | null;
    ownerInstitutionalUserId?: string | null;
  }
): boolean {
  // Admins can view all documents
  if (userContext.role === "admin") {
    return true;
  }

  // Faculty and staff can view documents
  if (userContext.role === "faculty" || userContext.role === "staff") {
    return true;
  }

  // Student can only view their own documents
  if (
    document.ownerProfileId &&
    document.ownerProfileId === userContext.userId
  ) {
    return true;
  }

  if (
    document.ownerInstitutionalUserId &&
    document.ownerInstitutionalUserId === userContext.userId
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the user is authorized to verify/approve a document.
 */
export function canVerifyDocument(
  userContext: DocumentPermissionContext
): boolean {
  // Students cannot verify documents
  if (userContext.role === "student") {
    return false;
  }

  return (
    userContext.role === "admin" ||
    userContext.role === "faculty" ||
    userContext.role === "staff"
  );
}
