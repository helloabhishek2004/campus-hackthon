import {
  CreateAcademicDocumentRequest,
  FacultyDocumentQuery,
  FacultyDocumentQueryInput,
  FacultyDocumentResponse,
  FacultyDashboardOverview,
  FacultyAuthorizedScopeItem,
  FacultyAcademicAssignment,
  AcademicDocument,
  ReviewStudentSubmissionRequest,
} from "@smart-campus/contracts";
import { getMockSession } from "../auth/client-session";

export interface StudentSubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  studentInstitutionalId: string;
  departmentCode: string;
  programCode: string;
  academicYear: number;
  semester: number;
  section: string;
  documentTitle: string;
  documentType: string;
  submittedAt: string;
  status: "SUBMITTED" | "RECEIVED" | "UNDER_REVIEW" | "ACCEPTED" | "RETURNED";
  remarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  attachmentName?: string;
}

export const facultyAcademicClientService = {
  getAuthHeaders(): Record<string, string> {
    const session = getMockSession();
    const headers: Record<string, string> = {};
    if (session?.id) {
      headers["x-campus-user-id"] = session.id;
    }
    return headers;
  },

  /**
   * Retrieves faculty dashboard metrics, stats, recent documents, and assignments.
   */
  async getOverview(): Promise<FacultyDashboardOverview | null> {
    try {
      const res = await fetch("/api/faculty/overview", {
        headers: this.getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.overview;
    } catch {
      return null;
    }
  },

  async getDashboardOverview(): Promise<FacultyDashboardOverview | null> {
    return this.getOverview();
  },

  /**
   * Retrieves authorized scopes for document composer.
   */
  async getAuthorizedScopes(): Promise<FacultyAuthorizedScopeItem[]> {
    try {
      const res = await fetch("/api/faculty/scopes", {
        headers: this.getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.scopes || [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves faculty academic assignments.
   */
  async getAssignments(): Promise<FacultyAcademicAssignment[]> {
    try {
      const res = await fetch("/api/faculty/assignments", {
        headers: this.getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.assignments || [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves paginated received or sent academic documents.
   */
  async getDocuments(
    query?: FacultyDocumentQueryInput
  ): Promise<FacultyDocumentResponse> {
    const params = new URLSearchParams();
    if (query?.tab) params.set("tab", query.tab);
    if (query?.filter && query.filter !== "all")
      params.set("filter", query.filter);
    if (query?.search && query.search.trim())
      params.set("search", query.search.trim());
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.limit) params.set("limit", String(query.limit));

    try {
      const res = await fetch(
        `/api/faculty/documents?${params.toString()}`,
        {
          headers: this.getAuthHeaders(),
          cache: "no-store",
        }
      );
      if (!res.ok) {
        return { items: [], nextCursor: null, hasMore: false, count: 0 };
      }
      return await res.json();
    } catch {
      return { items: [], nextCursor: null, hasMore: false, count: 0 };
    }
  },

  /**
   * Retrieves document detail by ID.
   */
  async getDocument(documentId: string): Promise<AcademicDocument | null> {
    try {
      const res = await fetch(`/api/faculty/documents/${documentId}`, {
        headers: this.getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.document || null;
    } catch {
      return null;
    }
  },

  /**
   * Marks a document as read.
   */
  async markRead(
    documentId: string
  ): Promise<{ success: boolean; isRead: boolean; readCount: number } | null> {
    try {
      const res = await fetch(`/api/faculty/documents/${documentId}/read`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async markAsRead(
    documentId: string
  ): Promise<{ success: boolean; isRead: boolean; readCount: number } | null> {
    return this.markRead(documentId);
  },

  /**
   * Creates and dispatches a formal academic document.
   */
  async createDocument(
    request: CreateAcademicDocumentRequest,
    file?: File | null
  ): Promise<{ success: boolean; document?: AcademicDocument; error?: string }> {
    try {
      let body: BodyInit;
      const headers = this.getAuthHeaders();

      if (file) {
        const formData = new FormData();
        formData.append("title", request.title);
        formData.append("content", request.content);
        formData.append("documentType", request.documentType);
        formData.append("priority", request.priority || "normal");
        if (request.deadline) formData.append("deadline", request.deadline);
        formData.append("targetScope", request.targetScope);
        if (request.targetDepartmentCode)
          formData.append("targetDepartmentCode", request.targetDepartmentCode);
        if (request.targetProgramCode)
          formData.append("targetProgramCode", request.targetProgramCode);
        if (request.targetAcademicYear)
          formData.append("targetAcademicYear", String(request.targetAcademicYear));
        if (request.targetSemester)
          formData.append("targetSemester", String(request.targetSemester));
        if (request.targetSection)
          formData.append("targetSection", request.targetSection);
        if (request.targetCourseId)
          formData.append("targetCourseId", request.targetCourseId);
        if (request.targetCourseName)
          formData.append("targetCourseName", request.targetCourseName);
        formData.append("file", file);
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(request);
      }

      const res = await fetch("/api/faculty/documents", {
        method: "POST",
        headers,
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to publish academic document.",
        };
      }

      return { success: true, document: data.document };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error publishing academic document.",
      };
    }
  },

  /**
   * Retrieves student submissions within faculty's scope.
   */
  async getStudentSubmissions(): Promise<StudentSubmissionItem[]> {
    try {
      const res = await fetch("/api/faculty/student-submissions", {
        headers: this.getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.submissions || [];
    } catch {
      return [];
    }
  },

  /**
   * Reviews student submission.
   */
  async reviewStudentSubmission(
    submissionId: string,
    request: ReviewStudentSubmissionRequest
  ): Promise<{ success: boolean; submission?: StudentSubmissionItem; error?: string }> {
    try {
      const res = await fetch(
        `/api/faculty/student-submissions/${submissionId}/review`,
        {
          method: "POST",
          headers: {
            ...this.getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to review student submission.",
        };
      }

      return { success: true, submission: data.submission };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error reviewing submission.",
      };
    }
  },
};
