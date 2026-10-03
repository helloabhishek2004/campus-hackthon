import { describe, it, expect } from "vitest";
import {
  canFacultyTargetScope,
  getAuthorizedScopeOptions,
  getFacultyAssignmentsForUser,
  resolveRecipientsForTarget,
  canFacultyAccessStudentSubmission,
} from "../lib/faculty/faculty-academic-permissions";
import { facultyAcademicService } from "../lib/faculty/faculty-academic-service";
import { UserAuthContext } from "../lib/campus-posts/campus-post-permissions";
import { CreateAcademicDocumentRequest } from "@smart-campus/contracts";

describe("Faculty Academic Permissions & Scoping Engine", () => {
  // Real Deterministic Mock User Contexts matching MOCK_INSTITUTIONAL_DIRECTORY
  const hodCSE: UserAuthContext = {
    id: "44444444-4444-4444-4444-444444440011",
    role: "faculty",
    fullName: "Dr. Aris Thorne",
    institutionalId: "FAC1011",
    departmentCode: "CSE",
    departmentId: "11111111-1111-1111-1111-111111111101",
    tags: ["HOD", "DEPARTMENT_COORDINATOR"],
  };

  const classCoordinatorCSE: UserAuthContext = {
    id: "44444444-4444-4444-4444-444444440002",
    role: "faculty",
    fullName: "Prof. Radhika Seth",
    institutionalId: "FAC1002",
    departmentCode: "CSE",
    departmentId: "11111111-1111-1111-1111-111111111101",
    tags: ["CLASS_COORDINATOR"],
  };

  const courseCoordinatorCS202: UserAuthContext = {
    id: "44444444-4444-4444-4444-444444440003",
    role: "faculty",
    fullName: "Dr. Alok Verma",
    institutionalId: "FAC1003",
    departmentCode: "CSE",
    departmentId: "11111111-1111-1111-1111-111111111101",
    tags: ["COURSE_COORDINATOR"],
  };

  const studentCSE: UserAuthContext = {
    id: "33333333-3333-3333-3333-333333330001",
    role: "student",
    fullName: "Aarav Sharma",
    institutionalId: "STU2026001",
    departmentCode: "CSE",
    programCode: "BTECH_CSE",
    academicYear: 3,
    semester: 6,
    section: "A",
    tags: [],
  };

  const adminUser: UserAuthContext = {
    id: "55555555-5555-5555-5555-555555550001",
    role: "admin",
    fullName: "System Registrar",
    institutionalId: "ADM001",
    tags: [],
  };

  describe("1. Assignment Resolution & Scope Listing", () => {
    it("retrieves active assignments for course coordinator", () => {
      const assignments = getFacultyAssignmentsForUser(courseCoordinatorCS202);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments.some((a) => a.courseCode === "CS202")).toBe(true);
    });

    it("generates authorized scope options for HOD", () => {
      const scopes = getAuthorizedScopeOptions(hodCSE);
      expect(scopes.length).toBeGreaterThan(0);
      expect(scopes.some((s) => s.scope === "department")).toBe(true);
      expect(scopes.some((s) => s.scope === "faculty")).toBe(true);
      expect(scopes.some((s) => s.scope === "cross_department")).toBe(true);
    });

    it("restricts course coordinator to assigned course scope", () => {
      const scopes = getAuthorizedScopeOptions(courseCoordinatorCS202);
      expect(scopes.length).toBeGreaterThan(0);
      expect(scopes.every((s) => s.scope === "course" || s.scope === "class")).toBe(true);
      expect(scopes.some((s) => s.scope === "department")).toBe(false);
      expect(scopes.some((s) => s.scope === "cross_department")).toBe(false);
    });

    it("denies scope options for students completely", () => {
      const scopes = getAuthorizedScopeOptions(studentCSE);
      expect(scopes).toEqual([]);
    });
  });

  describe("2. Server-Side Scope Authorization (Zero Privilege Escalation)", () => {
    it("allows Course Coordinator to publish to assigned course", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "CS202 Midterm Exam Syllabus",
        content: "Please review unit 1 to 3 before the midterm next Monday.",
        documentType: "Exam Schedule",
        priority: "high",
        targetScope: "course",
        targetCourseId: "77777777-7777-7777-7777-777777770001", // CS202
        targetCourseName: "Data Structures & Algorithms",
      };

      const result = canFacultyTargetScope(courseCoordinatorCS202, request);
      expect(result.allowed).toBe(true);
    });

    it("prevents Course Coordinator from targeting a different course", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "Malicious Course Announcement",
        content: "Announcing changes to course syllabus outside my jurisdiction.",
        documentType: "Course Announcement",
        priority: "normal",
        targetScope: "course",
        targetCourseId: "77777777-7777-7777-7777-777777770003", // CS301 (not assigned)
      };

      const result = canFacultyTargetScope(courseCoordinatorCS202, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not assigned");
    });

    it("prevents Course Coordinator from broadcasting to entire department", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "Department Wide Announcement",
        content: "Testing broadcast permission.",
        documentType: "Department Notice",
        priority: "normal",
        targetScope: "department",
        targetDepartmentCode: "CSE",
      };

      const result = canFacultyTargetScope(courseCoordinatorCS202, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("HOD or Department Coordinator");
    });

    it("allows Class Coordinator to publish to their assigned class section", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "Class Attendance Advisory",
        content: "Mandatory attendance check for 3rd year CSE Section A.",
        documentType: "Attendance Notice",
        priority: "normal",
        targetScope: "class",
        targetDepartmentCode: "CSE",
        targetProgramCode: "BTECH_CSE",
        targetAcademicYear: 3,
        targetSemester: 6,
        targetSection: "A",
      };

      const result = canFacultyTargetScope(classCoordinatorCSE, request);
      expect(result.allowed).toBe(true);
    });

    it("prevents Class Coordinator from publishing to unassigned class section", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "Interfering in Section C",
        content: "Advisory for unassigned section.",
        documentType: "Class Schedule",
        priority: "normal",
        targetScope: "class",
        targetDepartmentCode: "CSE",
        targetProgramCode: "BTECH_CSE",
        targetAcademicYear: 3,
        targetSemester: 6,
        targetSection: "C", // Not assigned
      };

      const result = canFacultyTargetScope(classCoordinatorCSE, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not assigned");
    });

    it("allows HOD to publish cross-department to another department", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "CSE & ECE Joint Curriculum Meeting",
        content: "Meeting for inter-departmental electives coordination.",
        documentType: "Meeting Notice",
        priority: "high",
        targetScope: "cross_department",
        targetDepartmentCode: "ECE",
      };

      const result = canFacultyTargetScope(hodCSE, request);
      expect(result.allowed).toBe(true);
    });

    it("strictly prevents non-HOD from sending cross-department communications", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "Cross Department Notice by Lecturer",
        content: "Unauthorized cross department notice.",
        documentType: "Academic Notice",
        priority: "normal",
        targetScope: "cross_department",
        targetDepartmentCode: "ECE",
      };

      const result = canFacultyTargetScope(courseCoordinatorCS202, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Department Heads (HOD)");
    });

    it("strictly prevents students from creating academic documents", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "Student Trying to Send Official Circular",
        content: "Notice cancellation of all lectures.",
        documentType: "Academic Circular",
        priority: "urgent",
        targetScope: "class",
        targetDepartmentCode: "CSE",
        targetProgramCode: "BTECH_CSE",
        targetAcademicYear: 3,
        targetSemester: 6,
        targetSection: "A",
      };

      const result = canFacultyTargetScope(studentCSE, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Students are not authorized");
    });

    it("allows institutional admin to publish institution-wide campus documents", () => {
      const request: CreateAcademicDocumentRequest = {
        title: "End Semester Examination Schedule",
        content: "Comprehensive exam schedule for all university colleges.",
        documentType: "Exam Schedule",
        priority: "high",
        targetScope: "campus",
      };

      const result = canFacultyTargetScope(adminUser, request);
      expect(result.allowed).toBe(true);
    });
  });

  describe("3. Recipient Resolution", () => {
    it("resolves students in specific class section", () => {
      const recipients = resolveRecipientsForTarget("class", {
        departmentCode: "CSE",
        programCode: "BTECH_CSE",
        academicYear: 3,
        semester: 6,
        section: "A",
      });

      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every((r) => r.role === "student")).toBe(true);
      expect(recipients.some((r) => r.fullName === "Aarav Sharma")).toBe(true);
    });

    it("resolves students in specific course", () => {
      const recipients = resolveRecipientsForTarget("course", {
        courseId: "77777777-7777-7777-7777-777777770001", // CS202
      });

      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every((r) => r.role === "student")).toBe(true);
    });

    it("resolves department students for department scope", () => {
      const recipients = resolveRecipientsForTarget("department", {
        departmentCode: "CSE",
      });

      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every((r) => r.role === "student")).toBe(true);
    });

    it("resolves faculty members for faculty scope", () => {
      const recipients = resolveRecipientsForTarget("faculty", {
        departmentCode: "CSE",
      });

      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every((r) => r.role === "faculty")).toBe(true);
      expect(recipients.some((r) => r.fullName === "Dr. Aris Thorne")).toBe(true);
    });

    it("resolves target department leadership for cross_department scope", () => {
      const recipients = resolveRecipientsForTarget("cross_department", {
        departmentCode: "ECE",
      });

      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every((r) => r.role === "faculty")).toBe(true);
      expect(recipients.some((r) => r.fullName === "Dr. Elena Vance")).toBe(true);
    });
  });

  describe("4. End-to-End Service Workflow & Read Tracking", () => {
    it("creates, delivers, and tracks an academic document", async () => {
      const newDoc = await facultyAcademicService.createDocument(classCoordinatorCSE, {
        title: "CSE 3rd Year Section A Lab Review",
        content: "Mandatory lab review session this Friday at 2:00 PM.",
        documentType: "Academic Notice",
        priority: "normal",
        targetScope: "class",
        targetDepartmentCode: "CSE",
        targetProgramCode: "BTECH_CSE",
        targetAcademicYear: 3,
        targetSemester: 6,
        targetSection: "A",
      });

      expect(newDoc.id).toBeDefined();
      expect(newDoc.status).toBe("SENT");
      expect(newDoc.deliveryCount).toBeGreaterThan(0);
      expect(newDoc.readCount).toBe(0);

      // Student checks received documents
      const studentInbox = await facultyAcademicService.getReceivedDocuments(studentCSE, {
        tab: "received",
        filter: "all",
        limit: 10,
      });

      const receivedItem = studentInbox.items.find((d) => d.id === newDoc.id);
      expect(receivedItem).toBeDefined();
      expect(receivedItem?.isRead).toBe(false);

      // Student marks document as read
      const readResult = await facultyAcademicService.markAsRead(studentCSE, newDoc.id);
      expect(readResult.success).toBe(true);
      expect(readResult.isRead).toBe(true);
      expect(readResult.readCount).toBe(1);

      // Idempotency: reading again should not double count
      const readResult2 = await facultyAcademicService.markAsRead(studentCSE, newDoc.id);
      expect(readResult2.readCount).toBe(1);

      // Sender checks sent document metrics
      const senderSent = await facultyAcademicService.getSentDocuments(classCoordinatorCSE, {
        tab: "sent",
        filter: "all",
        limit: 10,
      });

      const sentItem = senderSent.items.find((d) => d.id === newDoc.id);
      expect(sentItem).toBeDefined();
      expect(sentItem?.readCount).toBe(1);
    });

    it("verifies dashboard overview aggregates counts correctly", async () => {
      const overview = await facultyAcademicService.getDashboardOverview(hodCSE);
      expect(overview).toBeDefined();
      expect(overview.unreadDocumentsCount).toBeGreaterThanOrEqual(0);
      expect(overview.sentDocumentsCount).toBeGreaterThanOrEqual(0);
      expect(overview.assignments.length).toBeGreaterThan(0);
      expect(overview.recentReceived).toBeDefined();
      expect(overview.recentSent).toBeDefined();
    });
  });

  describe("5. Student Submission Review Permissions", () => {
    it("allows assigned course coordinator to review student submission", () => {
      const submission = {
        id: "sub-001",
        assignmentId: "acad-doc-002",
        courseId: "77777777-7777-7777-7777-777777770001", // CS202
        departmentCode: "CSE",
        programCode: "BTECH_CSE",
        academicYear: 2,
        semester: 4,
        section: "A",
      };

      const canAccess = canFacultyAccessStudentSubmission(courseCoordinatorCS202, submission);
      expect(canAccess).toBe(true);
    });

    it("denies unassigned faculty from accessing another course submission", () => {
      const submission = {
        id: "sub-002",
        assignmentId: "acad-doc-003",
        courseId: "77777777-7777-7777-7777-777777770003", // CS301 (not CS202)
        departmentCode: "CSE",
        programCode: "BTECH_CSE",
        academicYear: 2,
        semester: 3,
        section: "B",
      };

      const canAccess = canFacultyAccessStudentSubmission(courseCoordinatorCS202, submission);
      expect(canAccess).toBe(false);
    });

    it("allows HOD to access all student submissions in their department", () => {
      const submission = {
        id: "sub-003",
        assignmentId: "acad-doc-004",
        courseId: "77777777-7777-7777-7777-777777770003",
        departmentCode: "CSE",
        programCode: "BTECH_CSE",
        academicYear: 2,
        semester: 3,
        section: "B",
      };

      const canAccess = canFacultyAccessStudentSubmission(hodCSE, submission);
      expect(canAccess).toBe(true);
    });

    it("prevents faculty from accessing submissions of a different department", () => {
      const submission = {
        id: "sub-004",
        assignmentId: "acad-doc-005",
        courseId: "77777777-7777-7777-7777-777777770004",
        departmentCode: "ECE",
        programCode: "BTECH_ECE",
        academicYear: 3,
        semester: 5,
        section: "A",
      };

      const canAccess = canFacultyAccessStudentSubmission(courseCoordinatorCS202, submission);
      expect(canAccess).toBe(false);
    });
  });
});
