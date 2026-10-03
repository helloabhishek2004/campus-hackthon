import {
  CampusDocument,
  DocumentType,
  DocumentDownloadResponse,
} from "@smart-campus/contracts";
import { getMockSession } from "../auth/client-session";
import {
  MOCK_ACADEMIC_DOCUMENTS,
  MOCK_NON_ACADEMIC_DOCUMENTS,
} from "./documents-data";

export interface GetDocumentsOptions {
  category?: "all" | "academic" | "non-academic";
  query?: string;
}

export const documentsClientService = {
  /**
   * Fetches documents for the active student/user session.
   */
  async getDocuments(options?: GetDocumentsOptions): Promise<CampusDocument[]> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    const params = new URLSearchParams();
    if (options?.category && options.category !== "all") {
      params.set("category", options.category);
    }
    if (options?.query && options.query.trim()) {
      params.set("q", options.query.trim());
    }

    const url = `/api/documents${params.toString() ? `?${params.toString()}` : ""}`;

    try {
      const res = await fetch(url, {
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.documents && Array.isArray(json.documents)) {
          return json.documents;
        }
      }
    } catch (_err) {
      // Network or offline fallback
    }

    // Fallback to static mock documents
    let docs = [...MOCK_ACADEMIC_DOCUMENTS, ...MOCK_NON_ACADEMIC_DOCUMENTS];
    if (options?.category && options.category !== "all") {
      docs = docs.filter((d) => d.category === options.category);
    }
    if (options?.query && options.query.trim()) {
      const q = options.query.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.documentNumber.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    return docs;
  },

  /**
   * Fetches allowed document types for upload.
   */
  async getDocumentTypes(): Promise<DocumentType[]> {
    try {
      const res = await fetch("/api/document-types");
      if (res.ok) {
        const data = await res.json();
        if (data.documentTypes) {
          return data.documentTypes;
        }
      }
    } catch (_err) {
      // Fallback
    }
    return [];
  },

  /**
   * Uploads and registers a new document.
   */
  async uploadDocument(formData: FormData): Promise<{ success: boolean; document?: CampusDocument; error?: string }> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to upload document." };
      }

      return { success: true, document: data.document };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error uploading document." };
    }
  },

  /**
   * Generates a temporary signed download URL for certified document access.
   */
  async getDownloadUrl(documentId: string): Promise<DocumentDownloadResponse | null> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/download`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (_err) {
      // Fallback
    }

    return null;
  },
};
