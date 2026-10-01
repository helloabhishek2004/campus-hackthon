import { describe, it, expect } from "vitest";
import {
  canUploadDocumentType,
  canViewDocument,
  canVerifyDocument,
} from "../lib/documents/document-permissions";
import {
  validateDocumentFile,
  sanitizeFileName,
  createDocumentSignedUrl,
} from "../lib/documents/document-storage";
import {
  getDocumentTypes,
  listUserDocuments,
  createDocument,
  getDocumentById,
} from "../lib/documents/document-service";

describe("Document Management & Authorization", () => {
  describe("Permission Checks", () => {
    it("allows students to upload uploadable student documents", () => {
      const studentDocType = {
        code: "BONAFIDE_CERT",
        allowedRoles: ["student"],
        isUploadable: true,
      };
      expect(canUploadDocumentType("student", studentDocType)).toBe(true);
    });

    it("prevents students from uploading non-uploadable or administrative documents", () => {
      const systemDocType = {
        code: "DIGITAL_ID",
        allowedRoles: ["student", "faculty"],
        isUploadable: false,
      };
      expect(canUploadDocumentType("student", systemDocType)).toBe(false);

      const facultyOnlyDocType = {
        code: "SYLLABUS_NOTICE",
        allowedRoles: ["faculty"],
        isUploadable: true,
      };
      expect(canUploadDocumentType("student", facultyOnlyDocType)).toBe(false);
    });

    it("allows admins to upload any document type", () => {
      const systemDocType = {
        code: "DIGITAL_ID",
        allowedRoles: ["student"],
        isUploadable: false,
      };
      expect(canUploadDocumentType("admin", systemDocType)).toBe(true);
    });

    it("authorizes document viewing by owner", () => {
      const doc = {
        ownerProfileId: "user-123",
      };
      expect(
        canViewDocument(
          { userId: "user-123", role: "student" },
          doc
        )
      ).toBe(true);
    });

    it("authorizes document viewing by faculty and admin", () => {
      const doc = {
        ownerProfileId: "user-123",
      };
      expect(
        canViewDocument(
          { userId: "faculty-999", role: "faculty" },
          doc
        )
      ).toBe(true);
      expect(
        canViewDocument(
          { userId: "admin-001", role: "admin" },
          doc
        )
      ).toBe(true);
    });

    it("rejects unauthorized student viewing another student's document", () => {
      const doc = {
        ownerProfileId: "user-123",
      };
      expect(
        canViewDocument(
          { userId: "user-456", role: "student" },
          doc
        )
      ).toBe(false);
    });

    it("restricts document verification to faculty, staff, and admin", () => {
      expect(canVerifyDocument({ userId: "student-1", role: "student" })).toBe(false);
      expect(canVerifyDocument({ userId: "faculty-1", role: "faculty" })).toBe(true);
      expect(canVerifyDocument({ userId: "staff-1", role: "staff" })).toBe(true);
      expect(canVerifyDocument({ userId: "admin-1", role: "admin" })).toBe(true);
    });
  });

  describe("File Storage Validation", () => {
    it("accepts valid PDF and image MIME types under 10MB", () => {
      const validPdf = validateDocumentFile("application/pdf", 1024 * 1024);
      expect(validPdf.valid).toBe(true);

      const validPng = validateDocumentFile("image/png", 500 * 1024);
      expect(validPng.valid).toBe(true);
    });

    it("rejects disallowed MIME types", () => {
      const invalidExe = validateDocumentFile("application/x-msdownload", 1024);
      expect(invalidExe.valid).toBe(false);
      expect(invalidExe.error).toContain("Unsupported file type");
    });

    it("rejects files exceeding 10MB size limit", () => {
      const oversized = validateDocumentFile("application/pdf", 11 * 1024 * 1024);
      expect(oversized.valid).toBe(false);
      expect(oversized.error).toContain("exceeds 10MB");
    });

    it("sanitizes file names securely", () => {
      expect(sanitizeFileName("my file (1) [final]!.pdf")).toBe("my_file__1___final__.pdf");
    });

    it("creates a signed URL fallback for mock environments", async () => {
      const result = await createDocumentSignedUrl("documents/user1/doc1/v1/test.pdf");
      expect(result.signedUrl).toBeDefined();
      expect(result.expiresInSeconds).toBe(300);
    });
  });

  describe("Document Service Operations", () => {
    it("returns catalog of active document types", async () => {
      const types = await getDocumentTypes();
      expect(types.length).toBeGreaterThan(0);
      expect(types.some((t) => t.code === "BONAFIDE_CERT")).toBe(true);
    });

    it("lists documents for a user with category filtering", async () => {
      const allDocs = await listUserDocuments("33333333-3333-3333-3333-333333330001");
      expect(allDocs.length).toBeGreaterThan(0);

      const academicDocs = await listUserDocuments("33333333-3333-3333-3333-333333330001", {
        category: "academic",
      });
      expect(academicDocs.every((d) => d.category === "academic")).toBe(true);

      const nonAcademicDocs = await listUserDocuments("33333333-3333-3333-3333-333333330001", {
        category: "non-academic",
      });
      expect(nonAcademicDocs.every((d) => d.category === "non-academic")).toBe(true);
    });

    it("filters documents by search query", async () => {
      const searched = await listUserDocuments("33333333-3333-3333-3333-333333330001", {
        query: "Bonafide",
      });
      expect(searched.length).toBeGreaterThan(0);
      expect(searched[0].title).toContain("Bonafide");
    });

    it("creates a new document with valid parameters", async () => {
      const user = {
        id: "33333333-3333-3333-3333-333333330001",
        role: "student" as const,
        fullName: "Aarav Sharma",
      };

      const newDoc = await createDocument(user, {
        documentTypeCode: "BONAFIDE_CERT",
        title: "Internship Bonafide Application",
        category: "academic",
        description: "Bonafide proof required for Summer AI Internship",
      });

      expect(newDoc.id).toBeDefined();
      expect(newDoc.title).toBe("Internship Bonafide Application");
      expect(newDoc.status).toBe("Pending Verification");
      expect(newDoc.category).toBe("academic");

      // Verify retrieval by ID
      const retrieved = await getDocumentById(newDoc.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(newDoc.id);
    });

    it("prevents student from creating unauthorized document types", async () => {
      const user = {
        id: "33333333-3333-3333-3333-333333330001",
        role: "student" as const,
        fullName: "Aarav Sharma",
      };

      await expect(
        createDocument(user, {
          documentTypeCode: "DIGITAL_ID", // System-generated, not uploadable by student
          title: "Fake ID Creation",
          category: "academic",
        })
      ).rejects.toThrow("not authorized");
    });
  });
});
