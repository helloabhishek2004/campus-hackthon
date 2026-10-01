import {
  AcademicDocument,
  AcademicDocumentAttachment,
  CreateAcademicDocumentRequest,
  FacultyDocumentQuery,
  FacultyDocumentResponse,
  FacultyDashboardOverview,
  ReviewStudentSubmissionRequest,
} from "@smart-campus/contracts";
import { UserAuthContext } from "../campus-posts/campus-post-permissions";
import {
  canFacultyTargetScope,
  getFacultyAssignmentsForUser,
  resolveRecipientsForTarget,
  canFacultyAccessStudentSubmission,
} from "./faculty-academic-permissions";
import {
  MOCK_ACADEMIC_DOCUMENTS,
  MOCK_DOCUMENT_RECIPIENTS,
  MOCK_COURSES,
  MockDocumentRecipientRecord,
} from "./faculty-academic-seed-data";
import { MOCK_INSTITUTIONAL_DIRECTORY } from "../auth/mock-identities";
import { createClient } from "../supabase/server";

// ==============================================================================
// In-Memory Fallback State (Offline / Dev Mode)
// ==============================================================================

let IN_MEMORY_DOCS: AcademicDocument[] = [...MOCK_ACADEMIC_DOCUMENTS];
let IN_MEMORY_RECIPIENTS: MockDocumentRecipientRecord[] = [
  ...MOCK_DOCUMENT_RECIPIENTS,
];

// Student submissions store for review by faculty
export interface StudentSubmissionRecord {
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

let IN_MEMORY_STUDENT_SUBMISSIONS: StudentSubmissionRecord[] = [
  {
    id: "sub-001",
    studentId: "33333333-3333-3333-3333-333333330002",
    studentName: "Diya Patel",
    studentInstitutionalId: "STU2026002",
    departmentCode: "CSE",
    programCode: "BTECH_CSE",
    academicYear: 3,
    semester: 6,
    section: "A",
    documentTitle: "Bonafide Certificate Request for Summer Internship",
    documentType: "Bonafide Certificate",
    submittedAt: "2026-10-01T07:00:00Z",
    status: "SUBMITTED",
    attachmentName: "internship_offer_letter.pdf",
  },
  {
    id: "sub-002",
    studentId: "33333333-3333-3333-3333-333333330003",
    studentName: "Rohan Verma",
    studentInstitutionalId: "STU2026003",
    departmentCode: "CSE",
    programCode: "BTECH_CSE",
    academicYear: 2,
    semester: 4,
    section: "A",
    documentTitle: "CS202 Data Structures - Lab Assignment 1 Submission",
    documentType: "Assignment",
    submittedAt: "2026-09-30T16:00:00Z",
    status: "UNDER_REVIEW",
    attachmentName: "avl_tree_solution.zip",
  },
  {
    id: "sub-003",
    studentId: "33333333-3333-3333-3333-333333330013",
    studentName: "Arjun Gupta",
    studentInstitutionalId: "STU2026013",
    departmentCode: "ECE",
    programCode: "BTECH_ECE",
    academicYear: 3,
    semester: 6,
    section: "A",
    documentTitle: "Medical Leave Application & Hospital Discharge Slip",
    documentType: "Leave Application",
    submittedAt: "2026-09-29T12:00:00Z",
    status: "SUBMITTED",
    attachmentName: "medical_certificate.pdf",
  },
];

// Cursor Helpers
function encodeCursor(timestamp: string, id: string): string {
  return Buffer.from(JSON.stringify({ timestamp, id })).toString("base64");
}

function decodeCursor(cursor?: string): { timestamp: string; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ==============================================================================
// Faculty Academic Service Implementation
// ==============================================================================

export const facultyAcademicService = {
  /**
   * Retrieves dashboard metrics, recent documents, and assignments for the faculty member.
   */
  async getDashboardOverview(
    userContext: UserAuthContext
  ): Promise<FacultyDashboardOverview> {
    const assignments = getFacultyAssignmentsForUser(userContext);

    // 1. Unread received count
    const receivedRecords = IN_MEMORY_RECIPIENTS.filter(
      (r) => r.recipientInstitutionalUserId === userContext.id
    );
    const unreadCount = receivedRecords.filter((r) => !r.isRead).length;

    // 2. Sent count
    const sentDocs = IN_MEMORY_DOCS.filter(
      (d) =>
        d.senderInstitutionalUserId === userContext.id ||
        d.senderProfileId === userContext.id
    );

    // 3. Pending student submissions in faculty's scope
    const pendingSubmissions = IN_MEMORY_STUDENT_SUBMISSIONS.filter(
      (s) =>
        (s.status === "SUBMITTED" || s.status === "UNDER_REVIEW") &&
        canFacultyAccessStudentSubmission(userContext, {
          departmentCode: s.departmentCode,
          programCode: s.programCode,
          academicYear: s.academicYear,
          semester: s.semester,
          section: s.section,
        })
    );

    // 4. Assigned classes and courses
    const assignedClasses = assignments.filter((a) => a.assignmentType === "class");
    const assignedCourses = assignments.filter((a) => a.assignmentType === "course");

    // 5. Recent received
    const receivedDocIds = new Set(receivedRecords.map((r) => r.documentId));
    const recentReceived = IN_MEMORY_DOCS.filter((d) =>
      receivedDocIds.has(d.id)
    )
      .slice(0, 3)
      .map((d) => {
        const rx = receivedRecords.find((r) => r.documentId === d.id);
        return {
          ...d,
          isRead: rx ? rx.isRead : false,
          readAt: rx?.readAt,
        };
      });

    // 6. Recent sent
    const recentSent = sentDocs.slice(0, 3);

    return {
      unreadDocumentsCount: unreadCount,
      sentDocumentsCount: sentDocs.length,
      pendingSubmissionsCount: pendingSubmissions.length,
      assignedClassesCount: assignedClasses.length,
      assignedCoursesCount: assignedCourses.length,
      recentReceived,
      recentSent,
      assignments,
    };
  },

  /**
   * Retrieves received academic documents for the logged in user with cursor pagination.
   */
  async getReceivedDocuments(
    userContext: UserAuthContext,
    query?: FacultyDocumentQuery
  ): Promise<FacultyDocumentResponse> {
    const limit = Math.min(Math.max(1, query?.limit ?? 20), 100);
    const cursor = decodeCursor(query?.cursor);

    // Find all recipient records for this user
    const recipientRecords = IN_MEMORY_RECIPIENTS.filter(
      (r) => r.recipientInstitutionalUserId === userContext.id
    );
    const recipientMap = new Map(
      recipientRecords.map((r) => [r.documentId, r])
    );

    let docs = IN_MEMORY_DOCS.filter((d) => recipientMap.has(d.id)).map((d) => {
      const rx = recipientMap.get(d.id);
      return {
        ...d,
        isRead: rx ? rx.isRead : false,
        readAt: rx?.readAt,
      };
    });

    const totalUnread = docs.filter((d) => !d.isRead).length;

    // Apply Filter
    if (query?.filter && query.filter !== "all") {
      if (query.filter === "unread") {
        docs = docs.filter((d) => !d.isRead);
      } else {
        docs = docs.filter(
          (d) =>
            d.documentType.toLowerCase().includes(query.filter.toLowerCase()) ||
            d.targetScope.toLowerCase() === query.filter.toLowerCase()
        );
      }
    }

    // Apply Search
    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.senderName.toLowerCase().includes(q) ||
          d.documentType.toLowerCase().includes(q)
      );
    }

    // Sort descending by createdAt, id
    docs.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      return b.id.localeCompare(a.id);
    });

    const totalCount = docs.length;

    // Cursor pagination
    if (cursor) {
      const cursorTime = new Date(cursor.timestamp).getTime();
      docs = docs.filter((d) => {
        const dTime = new Date(d.createdAt).getTime();
        if (dTime < cursorTime) return true;
        if (dTime === cursorTime) return d.id < cursor.id;
        return false;
      });
    }

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor =
      hasMore && items.length > 0
        ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
        : null;

    return {
      items,
      nextCursor,
      hasMore,
      count: totalCount,
      unreadCount: totalUnread,
    };
  },

  /**
   * Retrieves documents sent by this faculty member with cursor pagination and delivery counts.
   */
  async getSentDocuments(
    userContext: UserAuthContext,
    query?: FacultyDocumentQuery
  ): Promise<FacultyDocumentResponse> {
    const limit = Math.min(Math.max(1, query?.limit ?? 20), 100);
    const cursor = decodeCursor(query?.cursor);

    let docs = IN_MEMORY_DOCS.filter(
      (d) =>
        d.senderInstitutionalUserId === userContext.id ||
        d.senderProfileId === userContext.id
    );

    // Apply Filter
    if (query?.filter && query.filter !== "all") {
      docs = docs.filter(
        (d) =>
          d.documentType.toLowerCase().includes(query.filter.toLowerCase()) ||
          d.targetScope.toLowerCase() === query.filter.toLowerCase()
      );
    }

    // Apply Search
    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.targetDisplayName.toLowerCase().includes(q)
      );
    }

    // Sort descending by createdAt, id
    docs.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      return b.id.localeCompare(a.id);
    });

    const totalCount = docs.length;

    // Cursor pagination
    if (cursor) {
      const cursorTime = new Date(cursor.timestamp).getTime();
      docs = docs.filter((d) => {
        const dTime = new Date(d.createdAt).getTime();
        if (dTime < cursorTime) return true;
        if (dTime === cursorTime) return d.id < cursor.id;
        return false;
      });
    }

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor =
      hasMore && items.length > 0
        ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
        : null;

    return {
      items,
      nextCursor,
      hasMore,
      count: totalCount,
    };
  },

  /**
   * Retrieves a single academic document by ID, checking authorization and auto-marking read if recipient.
   */
  async getDocumentById(
    userContext: UserAuthContext,
    documentId: string
  ): Promise<AcademicDocument | null> {
    const doc = IN_MEMORY_DOCS.find((d) => d.id === documentId);
    if (!doc) return null;

    const isSender =
      doc.senderInstitutionalUserId === userContext.id ||
      doc.senderProfileId === userContext.id ||
      userContext.role === "admin";

    const recipientRecord = IN_MEMORY_RECIPIENTS.find(
      (r) =>
        r.documentId === documentId &&
        r.recipientInstitutionalUserId === userContext.id
    );

    if (!isSender && !recipientRecord) {
      throw new Error(
        "Forbidden: You are not authorized to view this academic document."
      );
    }

    // If opened by recipient and unread, mark as read on the server
    if (recipientRecord && !recipientRecord.isRead) {
      recipientRecord.isRead = true;
      recipientRecord.readAt = new Date().toISOString();
      doc.readCount = Math.min(doc.deliveryCount, doc.readCount + 1);
    }

    return {
      ...doc,
      isRead: recipientRecord ? recipientRecord.isRead : true,
      readAt: recipientRecord?.readAt,
    };
  },

  /**
   * Marks a document as read for the authenticated recipient.
   */
  async markAsRead(
    userContext: UserAuthContext,
    documentId: string
  ): Promise<{ success: boolean; isRead: boolean; readCount: number }> {
    const doc = IN_MEMORY_DOCS.find((d) => d.id === documentId);
    if (!doc) throw new Error("Document not found.");

    const recipientRecord = IN_MEMORY_RECIPIENTS.find(
      (r) =>
        r.documentId === documentId &&
        r.recipientInstitutionalUserId === userContext.id
    );

    if (!recipientRecord) {
      throw new Error(
        "Forbidden: You are not a registered recipient of this document."
      );
    }

    if (!recipientRecord.isRead) {
      recipientRecord.isRead = true;
      recipientRecord.readAt = new Date().toISOString();
      doc.readCount = Math.min(doc.deliveryCount, doc.readCount + 1);
    }

    return {
      success: true,
      isRead: true,
      readCount: doc.readCount,
    };
  },

  /**
   * Creates and dispatches a formal academic document after strict server authorization.
   */
  async createDocument(
    userContext: UserAuthContext,
    request: CreateAcademicDocumentRequest,
    attachment?: {
      storagePath: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
    }
  ): Promise<AcademicDocument> {
    // 1. Validate Scope Authority
    const authCheck = canFacultyTargetScope(userContext, request);
    if (!authCheck.allowed) {
      throw new Error(`Forbidden: ${authCheck.reason}`);
    }

    // 2. Resolve Recipients
    const recipients = resolveRecipientsForTarget(request.targetScope, {
      departmentCode: (request.targetDepartmentCode || userContext.departmentCode) ?? undefined,
      programCode: request.targetProgramCode,
      academicYear: request.targetAcademicYear,
      semester: request.targetSemester,
      section: request.targetSection,
      courseId: request.targetCourseId,
    });

    if (recipients.length === 0) {
      throw new Error(
        "Cannot publish academic document: Selected target scope contains zero eligible recipients."
      );
    }

    const docId = `acad-doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Determine target display name
    let targetDisplayName = "Audience";
    if (request.targetScope === "class") {
      targetDisplayName = `${request.targetDepartmentCode || userContext.departmentCode || "Class"} Year ${request.targetAcademicYear || 3} Sem ${request.targetSemester || 6} (${request.targetSection || "A"})`;
    } else if (request.targetScope === "course") {
      const course = MOCK_COURSES.find((c) => c.id === request.targetCourseId);
      targetDisplayName = course ? `${course.code}: ${course.name}` : (request.targetCourseName || "Course Students");
    } else if (request.targetScope === "department") {
      targetDisplayName = `${request.targetDepartmentCode || userContext.departmentCode} Department - All Students`;
    } else if (request.targetScope === "faculty") {
      targetDisplayName = `${request.targetDepartmentCode || userContext.departmentCode} Department - Faculty Colleagues`;
    } else if (request.targetScope === "cross_department") {
      targetDisplayName = `${request.targetDepartmentCode} Department Faculty Leadership`;
    } else if (request.targetScope === "campus") {
      targetDisplayName = "Institution-Wide Campus";
    }

    const attachments: AcademicDocumentAttachment[] = attachment
      ? [
          {
            id: `att-${Date.now()}`,
            storagePath: attachment.storagePath,
            originalFilename: attachment.originalFilename,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
          },
        ]
      : [];

    const newDoc: AcademicDocument = {
      id: docId,
      senderProfileId: userContext.id,
      senderInstitutionalUserId: userContext.id,
      senderName: userContext.fullName,
      senderRole: userContext.role === "admin" ? "Administrator" : "Faculty Member",
      senderDepartment: userContext.departmentCode || undefined,
      documentType: request.documentType,
      title: request.title,
      content: request.content,
      priority: request.priority,
      deadline: request.deadline,
      status: "SENT",
      targetScope: request.targetScope,
      targetDepartmentId: request.targetDepartmentId,
      targetDepartmentCode: (request.targetDepartmentCode || userContext.departmentCode) ?? undefined,
      targetProgramId: request.targetProgramId,
      targetProgramCode: request.targetProgramCode,
      targetAcademicYear: request.targetAcademicYear,
      targetSemester: request.targetSemester,
      targetSection: request.targetSection,
      targetCourseId: request.targetCourseId,
      targetCourseName: request.targetCourseName,
      targetDisplayName,
      deliveryCount: recipients.length,
      readCount: 0,
      attachments,
      createdAt: now,
      updatedAt: now,
    };

    // Save in memory
    IN_MEMORY_DOCS.unshift(newDoc);

    // Save recipients in memory
    recipients.forEach((rec, idx) => {
      IN_MEMORY_RECIPIENTS.push({
        id: `rec-${Date.now()}-${idx}`,
        documentId: docId,
        recipientInstitutionalUserId: rec.institutionalUserId,
        recipientRole: rec.role,
        recipientName: rec.fullName,
        isRead: false,
      });
    });

    // Try persisting to Supabase if available
    try {
      const supabase = await createClient();
      await supabase.from("academic_documents").insert({
        id: newDoc.id,
        sender_profile_id: userContext.id,
        sender_institutional_user_id: userContext.id,
        sender_name: newDoc.senderName,
        sender_role: newDoc.senderRole,
        sender_department: newDoc.senderDepartment,
        document_type: newDoc.documentType,
        title: newDoc.title,
        content: newDoc.content,
        priority: newDoc.priority,
        deadline: newDoc.deadline,
        status: newDoc.status,
        target_scope: newDoc.targetScope,
        target_department_id: newDoc.targetDepartmentId,
        target_department_code: newDoc.targetDepartmentCode,
        target_program_id: newDoc.targetProgramId,
        target_program_code: newDoc.targetProgramCode,
        target_academic_year: newDoc.targetAcademicYear,
        target_semester: newDoc.targetSemester,
        target_section: newDoc.targetSection,
        target_course_id: newDoc.targetCourseId,
        target_course_name: newDoc.targetCourseName,
        target_display_name: newDoc.targetDisplayName,
        delivery_count: newDoc.deliveryCount,
        read_count: 0,
        attachments: newDoc.attachments,
        created_at: now,
        updated_at: now,
      });

      // Insert recipients batch
      const recipientInserts = recipients.map((rec) => ({
        document_id: docId,
        recipient_institutional_user_id: rec.institutionalUserId,
        recipient_role: rec.role,
        recipient_name: rec.fullName,
        is_read: false,
      }));
      await supabase.from("academic_document_recipients").insert(recipientInserts);

      // Audit event
      await supabase.from("academic_document_events").insert({
        document_id: docId,
        actor_profile_id: userContext.id,
        event_type: "DOCUMENT_SENT",
        event_metadata: {
          recipientsCount: recipients.length,
          targetScope: request.targetScope,
        },
      });
    } catch (_err) {
      // Offline fallback
    }

    return newDoc;
  },

  /**
   * Retrieves student submissions accessible to this faculty member based on authorized scope.
   */
  async getStudentSubmissions(
    userContext: UserAuthContext
  ): Promise<StudentSubmissionRecord[]> {
    if (userContext.role !== "faculty" && userContext.role !== "admin") {
      return [];
    }

    return IN_MEMORY_STUDENT_SUBMISSIONS.filter((sub) =>
      canFacultyAccessStudentSubmission(userContext, {
        departmentCode: sub.departmentCode,
        programCode: sub.programCode,
        academicYear: sub.academicYear,
        semester: sub.semester,
        section: sub.section,
      })
    );
  },

  /**
   * Reviews a student submission (Accept/Return/Under Review).
   */
  async reviewStudentSubmission(
    userContext: UserAuthContext,
    submissionId: string,
    request: ReviewStudentSubmissionRequest
  ): Promise<StudentSubmissionRecord> {
    const sub = IN_MEMORY_STUDENT_SUBMISSIONS.find((s) => s.id === submissionId);
    if (!sub) {
      throw new Error(`Student submission with ID '${submissionId}' not found.`);
    }

    const hasAccess = canFacultyAccessStudentSubmission(userContext, {
      departmentCode: sub.departmentCode,
      programCode: sub.programCode,
      academicYear: sub.academicYear,
      semester: sub.semester,
      section: sub.section,
    });

    if (!hasAccess) {
      throw new Error(
        "Forbidden: You are not authorized to review this student submission."
      );
    }

    sub.status = request.status;
    sub.remarks = request.remarks;
    sub.reviewedBy = userContext.fullName;
    sub.reviewedAt = new Date().toISOString();

    return sub;
  },
};
