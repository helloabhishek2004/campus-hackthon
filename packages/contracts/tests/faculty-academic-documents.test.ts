import { describe, it, expect } from "vitest";
import {
  AcademicDocumentTypeSchema,
  AcademicDocumentPrioritySchema,
  AcademicDocumentStatusSchema,
  AcademicTargetScopeSchema,
  CourseSchema,
  FacultyAcademicAssignmentSchema,
  CreateAcademicDocumentRequestSchema,
  AcademicDocumentSchema,
} from "../src/faculty-academic-documents";

describe("Faculty Academic Documents Contracts", () => {
  it("validates all 15 formal academic document types", () => {
    const validTypes = [
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
    ];

    validTypes.forEach((type) => {
      expect(AcademicDocumentTypeSchema.safeParse(type).success).toBe(true);
    });

    expect(AcademicDocumentTypeSchema.safeParse("Random Meme").success).toBe(false);
  });

  it("validates course schema", () => {
    const course = {
      id: "77777777-7777-7777-7777-777777770001",
      code: "CS202",
      name: "Data Structures & Algorithms",
      departmentId: "11111111-1111-1111-1111-111111111101",
      programId: "22222222-2222-2222-2222-222222222201",
      semester: 4,
      credits: 4,
      isActive: true,
    };
    expect(CourseSchema.safeParse(course).success).toBe(true);
  });

  it("validates faculty academic assignment schema", () => {
    const assignment = {
      id: "77777777-7777-7777-7777-777777770010",
      facultyInstitutionalUserId: "44444444-4444-4444-4444-444444440003",
      assignmentType: "course",
      departmentId: "11111111-1111-1111-1111-111111111101",
      programId: "22222222-2222-2222-2222-222222222201",
      semester: 4,
      section: "A",
      courseId: "77777777-7777-7777-7777-777777770001",
      roleTitle: "Course Coordinator",
      academicSession: "2025-2026",
      isActive: true,
    };
    expect(FacultyAcademicAssignmentSchema.safeParse(assignment).success).toBe(true);
  });

  it("validates CreateAcademicDocumentRequestSchema", () => {
    const validReq = {
      title: "Mid-Term Examination Rubrics & Schedule",
      content: "Theory exams will be conducted in Block B from 10:00 AM to 1:00 PM. Practical evaluations precede theory tests.",
      documentType: "Exam Schedule",
      priority: "high",
      targetScope: "department",
      targetDepartmentCode: "CSE",
    };
    expect(CreateAcademicDocumentRequestSchema.safeParse(validReq).success).toBe(true);

    // Short title rejected
    expect(
      CreateAcademicDocumentRequestSchema.safeParse({
        ...validReq,
        title: "No",
      }).success
    ).toBe(false);

    // Short content rejected
    expect(
      CreateAcademicDocumentRequestSchema.safeParse({
        ...validReq,
        content: "Short",
      }).success
    ).toBe(false);
  });

  it("validates canonical AcademicDocumentSchema", () => {
    const doc = {
      id: "doc-001",
      senderProfileId: "44444444-4444-4444-4444-444444440011",
      senderName: "Dr. Aris Thorne",
      senderRole: "Head of Department",
      senderDepartment: "CSE",
      title: "Department Academic Calendar & Lab Renovations",
      content: "Please find the finalized schedule for lab renovations and continuous assessments.",
      documentType: "Department Notice",
      priority: "normal",
      status: "SENT",
      targetScope: "department",
      targetDepartmentCode: "CSE",
      targetDisplayName: "CSE Department - All Students & Faculty",
      deliveryCount: 52,
      readCount: 38,
      isRead: false,
      attachments: [],
      createdAt: "2026-10-01T08:00:00Z",
      updatedAt: "2026-10-01T08:00:00Z",
    };
    expect(AcademicDocumentSchema.safeParse(doc).success).toBe(true);
  });
});
