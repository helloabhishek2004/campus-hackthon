import { describe, it, expect } from "vitest";
import {
  CampusDocumentSchema,
  CreateDocumentRequestSchema,
  DocumentTypeSchema,
  DocumentDownloadResponseSchema,
} from "../src/documents";

describe("Document Contracts Validation", () => {
  it("validates a valid CampusDocument object", () => {
    const doc = {
      id: "doc-acad-01",
      title: "Institutional Digital ID",
      category: "academic",
      description: "Official university identity card.",
      status: "Active",
      statusVariant: "success",
      issuedDate: "Aug 2023",
      validThrough: "Jul 2027",
      documentNumber: "ID-2026-8841",
      iconName: "id-card",
      details: {
        issuer: "Office of the Registrar",
        verifiedBy: "Academic Security Cell",
        referenceCode: "CAMPUS-ID-VERIFIED",
        remarks: "Digitally signed certificate.",
      },
      currentVersion: 1,
    };

    const parsed = CampusDocumentSchema.safeParse(doc);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Institutional Digital ID");
      expect(parsed.data.category).toBe("academic");
      expect(parsed.data.currentVersion).toBe(1);
    }
  });

  it("validates a valid CreateDocumentRequest", () => {
    const req = {
      documentTypeCode: "BONAFIDE_CERT",
      title: "Bonafide Certificate Application",
      description: "Required for passport verification",
      category: "academic",
      originalFilename: "bonafide_app.pdf",
      mimeType: "application/pdf",
      fileSize: 1024 * 500,
    };

    const parsed = CreateDocumentRequestSchema.safeParse(req);
    expect(parsed.success).toBe(true);
  });

  it("rejects CreateDocumentRequest with oversized file", () => {
    const req = {
      documentTypeCode: "BONAFIDE_CERT",
      title: "Bonafide Application",
      category: "academic",
      fileSize: 15 * 1024 * 1024, // 15MB > 10MB limit
    };

    const parsed = CreateDocumentRequestSchema.safeParse(req);
    expect(parsed.success).toBe(false);
  });

  it("validates DocumentDownloadResponse", () => {
    const res = {
      documentId: "doc-123",
      title: "Digital ID",
      downloadUrl: "https://example.com/storage/v1/documents/doc-123.pdf",
      fileName: "Digital_ID.pdf",
      mimeType: "application/pdf",
      expiresInSeconds: 300,
      isMock: false,
    };

    const parsed = DocumentDownloadResponseSchema.safeParse(res);
    expect(parsed.success).toBe(true);
  });
});
