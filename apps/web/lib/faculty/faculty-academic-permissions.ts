import {
  AcademicTargetScope,
  FacultyAuthorizedScopeItem,
  CreateAcademicDocumentRequest,
} from "@smart-campus/contracts";
import { UserAuthContext } from "../campus-posts/campus-post-permissions";
import {
  MOCK_FACULTY_ASSIGNMENTS,
  MOCK_COURSES,
} from "./faculty-academic-seed-data";
import { MOCK_INSTITUTIONAL_DIRECTORY } from "../auth/mock-identities";

/**
 * Returns all active academic assignments for the faculty user.
 */
export function getFacultyAssignmentsForUser(userContext: UserAuthContext) {
  return MOCK_FACULTY_ASSIGNMENTS.filter(
    (a) => a.facultyInstitutionalUserId === userContext.id && a.isActive
  );
}

/**
 * Determines whether a user has a specific responsibility tag.
 */
function hasTag(userContext: UserAuthContext, tag: string): boolean {
  return Array.isArray(userContext.tags) && userContext.tags.includes(tag as any);
}

/**
 * Resolves the authorized academic scopes and available recipient targets for a faculty member.
 * Frontend displays ONLY these options.
 */
export function getAuthorizedScopeOptions(
  userContext: UserAuthContext
): FacultyAuthorizedScopeItem[] {
  // Students cannot publish academic documents
  if (userContext.role === "student") {
    return [];
  }

  const items: FacultyAuthorizedScopeItem[] = [];
  const assignments = getFacultyAssignmentsForUser(userContext);
  const isHod = hasTag(userContext, "HOD") || userContext.role === "department_head";
  const isDeptCoord = hasTag(userContext, "DEPARTMENT_COORDINATOR");
  const isAdmin = userContext.role === "admin";
  const deptCode = userContext.departmentCode || "CSE";

  // 1. Course Coordinator / Instructor Course Assignments
  const courseAssignments = assignments.filter((a) => a.assignmentType === "course");
  courseAssignments.forEach((ca) => {
    const course = MOCK_COURSES.find((c) => c.id === ca.courseId);
    const courseName = course?.name || ca.courseName || "Assigned Course";
    const courseCode = course?.code || ca.courseCode || "COURSE";

    // Estimate students in that course's class/semester
    const enrolledStudents = MOCK_INSTITUTIONAL_DIRECTORY.filter(
      (u) =>
        u.role === "student" &&
        u.departmentCode === (ca.departmentCode || deptCode) &&
        (!ca.semester || u.semester === ca.semester) &&
        (!ca.section || u.section === ca.section)
    ).length;

    items.push({
      id: `course-${ca.courseId || courseCode}`,
      scope: "course",
      displayName: `Course: ${courseCode} - ${courseName} (${ca.section ? `Sec ${ca.section}` : "All Sections"})`,
      description: `Communicate with students enrolled in ${courseName}.`,
      estimatedRecipients: Math.max(1, enrolledStudents),
      departmentCode: ca.departmentCode || deptCode,
      programId: ca.programId,
      programCode: ca.programCode,
      academicYear: ca.academicYear,
      semester: ca.semester,
      section: ca.section,
      courseId: ca.courseId,
      courseName: `${courseCode}: ${courseName}`,
    });
  });

  // 2. Class Coordinator Class Assignments
  const classAssignments = assignments.filter((a) => a.assignmentType === "class");
  classAssignments.forEach((cla) => {
    const matchingStudents = MOCK_INSTITUTIONAL_DIRECTORY.filter(
      (u) =>
        u.role === "student" &&
        u.departmentCode === (cla.departmentCode || deptCode) &&
        u.academicYear === cla.academicYear &&
        u.semester === cla.semester &&
        u.section === cla.section
    ).length;

    items.push({
      id: `class-${cla.academicYear}-${cla.semester}-${cla.section}`,
      scope: "class",
      displayName: `Class: ${cla.departmentCode || deptCode} Year ${cla.academicYear} Sem ${cla.semester} (Sec ${cla.section})`,
      description: `Formal communication to your assigned class section.`,
      estimatedRecipients: Math.max(1, matchingStudents),
      departmentCode: cla.departmentCode || deptCode,
      programId: cla.programId,
      programCode: cla.programCode,
      academicYear: cla.academicYear,
      semester: cla.semester,
      section: cla.section,
    });
  });

  // Fallback for Class Coordinator tag if assignment table entry was inferred
  if (hasTag(userContext, "CLASS_COORDINATOR") && items.filter((i) => i.scope === "class").length === 0) {
    const yr = userContext.academicYear || 3;
    const sem = userContext.semester || 6;
    const sec = userContext.section || "A";
    const matching = MOCK_INSTITUTIONAL_DIRECTORY.filter(
      (u) =>
        u.role === "student" &&
        u.departmentCode === deptCode &&
        u.academicYear === yr &&
        u.section === sec
    ).length;

    items.push({
      id: `class-tag-${yr}-${sem}-${sec}`,
      scope: "class",
      displayName: `Class: ${deptCode} Year ${yr} Sem ${sem} (Sec ${sec})`,
      description: `Formal communication to your assigned class section.`,
      estimatedRecipients: Math.max(1, matching),
      departmentCode: deptCode,
      academicYear: yr,
      semester: sem,
      section: sec,
    });
  }

  // 3. Department Coordinator & HOD Scopes (Department-wide & Program-wide)
  if (isHod || isDeptCoord || isAdmin) {
    const deptStudentsCount = MOCK_INSTITUTIONAL_DIRECTORY.filter(
      (u) => u.role === "student" && (isAdmin || u.departmentCode === deptCode)
    ).length;

    const deptFacultyCount = MOCK_INSTITUTIONAL_DIRECTORY.filter(
      (u) => u.role === "faculty" && (isAdmin || u.departmentCode === deptCode)
    ).length;

    items.push({
      id: `dept-students-${deptCode}`,
      scope: "department",
      displayName: `${deptCode} Department — All Students (${deptStudentsCount} students)`,
      description: `Official notices, examination circulars, and departmental announcements.`,
      estimatedRecipients: deptStudentsCount,
      departmentCode: deptCode,
    });

    items.push({
      id: `dept-faculty-${deptCode}`,
      scope: "faculty",
      displayName: `${deptCode} Department — Faculty Colleagues (${deptFacultyCount} faculty)`,
      description: `Internal department faculty circulars, syllabus committees, and meetings.`,
      estimatedRecipients: deptFacultyCount,
      departmentCode: deptCode,
    });
  }

  // 4. HOD Authorized Cross-Department Communication
  if (isHod || isAdmin) {
    // Other departments faculty leadership
    const otherDepts = ["ECE", "CSE", "MECH", "CIVIL", "IT"].filter((d) => d !== deptCode);
    otherDepts.forEach((otherDept) => {
      const otherDeptFacultyCount = MOCK_INSTITUTIONAL_DIRECTORY.filter(
        (u) => u.role === "faculty" && u.departmentCode === otherDept
      ).length;

      items.push({
        id: `cross-dept-${otherDept}`,
        scope: "cross_department",
        displayName: `Cross-Department: ${otherDept} Faculty Leadership (${otherDeptFacultyCount} faculty)`,
        description: `Official inter-departmental academic communication to ${otherDept} department leadership.`,
        estimatedRecipients: otherDeptFacultyCount,
        departmentCode: otherDept,
      });
    });
  }

  // 5. Admin Institution-Wide
  if (isAdmin) {
    const totalCampus = MOCK_INSTITUTIONAL_DIRECTORY.length;
    items.push({
      id: "campus-all",
      scope: "campus",
      displayName: `Institution-Wide Campus (${totalCampus} total users)`,
      description: `Statutory institution-wide academic notifications and calendar circulars.`,
      estimatedRecipients: totalCampus,
    });
  }

  return items;
}

/**
 * Strictly verifies whether a faculty member is authorized to target the specified scope.
 * Prevents unauthorized cross-department, class, or institutional broadcasts.
 */
export function canFacultyTargetScope(
  userContext: UserAuthContext,
  request: CreateAcademicDocumentRequest
): { allowed: boolean; reason?: string } {
  // Students are unconditionally blocked from academic communication
  if (userContext.role === "student") {
    return {
      allowed: false,
      reason: "Students are not authorized to publish formal academic documents.",
    };
  }

  // Admin has institution-wide privileges
  if (userContext.role === "admin") {
    return { allowed: true };
  }

  const isHod = hasTag(userContext, "HOD") || userContext.role === "department_head";
  const isDeptCoord = hasTag(userContext, "DEPARTMENT_COORDINATOR");
  const deptCode = userContext.departmentCode || "CSE";
  const assignments = getFacultyAssignmentsForUser(userContext);

  switch (request.targetScope) {
    case "campus":
      return {
        allowed: false,
        reason: "Only institutional administrators can broadcast campus-wide academic circulars.",
      };

    case "cross_department":
      if (!isHod) {
        return {
          allowed: false,
          reason: "Cross-department academic communication is restricted to Department Heads (HOD).",
        };
      }
      return { allowed: true };

    case "department":
    case "faculty":
      if (!isHod && !isDeptCoord) {
        return {
          allowed: false,
          reason: "Department-wide academic communication requires HOD or Department Coordinator authority.",
        };
      }
      if (request.targetDepartmentCode && request.targetDepartmentCode !== deptCode) {
        return {
          allowed: false,
          reason: `You cannot target department '${request.targetDepartmentCode}' (your authority is '${deptCode}').`,
        };
      }
      return { allowed: true };

    case "program":
      if (isHod || isDeptCoord) {
        return { allowed: true };
      }
      // Check program assignment
      const hasProg = assignments.some(
        (a) => a.assignmentType === "program" && a.programCode === request.targetProgramCode
      );
      if (!hasProg) {
        return {
          allowed: false,
          reason: `You are not assigned to program '${request.targetProgramCode}'.`,
        };
      }
      return { allowed: true };

    case "class":
      if (isHod) {
        // HOD can target classes in their department
        return { allowed: true };
      }
      // Class coordinator or assigned faculty
      const matchingClassAssign = assignments.find(
        (a) =>
          a.assignmentType === "class" &&
          (!request.targetAcademicYear || a.academicYear === request.targetAcademicYear) &&
          (!request.targetSemester || a.semester === request.targetSemester) &&
          (!request.targetSection || a.section === request.targetSection)
      );

      if (matchingClassAssign) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: "You are not assigned as the coordinator or instructor for this class.",
      };

    case "course":
      if (isHod) {
        return { allowed: true };
      }
      // Course coordinator or assigned instructor
      const matchingCourseAssign = assignments.find(
        (a) =>
          a.assignmentType === "course" &&
          (!request.targetCourseId || a.courseId === request.targetCourseId)
      );

      if (matchingCourseAssign) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: "You are not assigned as the Course Coordinator for this course.",
      };

    default:
      return { allowed: false, reason: "Invalid target scope." };
  }
}

/**
 * Resolves the explicit list of recipient institutional users for a validated academic target.
 * Computed entirely on server.
 */
export function resolveRecipientsForTarget(
  targetScope: AcademicTargetScope,
  params: {
    departmentCode?: string;
    programCode?: string;
    academicYear?: number;
    semester?: number;
    section?: string;
    courseId?: string;
  }
): Array<{
  institutionalUserId: string;
  fullName: string;
  role: "student" | "faculty" | "staff" | "admin";
}> {
  let recipients = [...MOCK_INSTITUTIONAL_DIRECTORY];

  switch (targetScope) {
    case "campus":
      // All active users
      break;

    case "department":
      recipients = recipients.filter(
        (u) => u.departmentCode === params.departmentCode && u.role === "student"
      );
      break;

    case "faculty":
      recipients = recipients.filter(
        (u) => u.departmentCode === params.departmentCode && u.role === "faculty"
      );
      break;

    case "cross_department":
      recipients = recipients.filter(
        (u) => u.departmentCode === params.departmentCode && u.role === "faculty"
      );
      break;

    case "program":
      recipients = recipients.filter(
        (u) => u.programCode === params.programCode && u.role === "student"
      );
      break;

    case "class":
      recipients = recipients.filter(
        (u) =>
          u.role === "student" &&
          (!params.departmentCode || u.departmentCode === params.departmentCode) &&
          (!params.academicYear || u.academicYear === params.academicYear) &&
          (!params.semester || u.semester === params.semester) &&
          (!params.section || u.section === params.section)
      );
      break;

    case "course":
      // Resolve students belonging to that course
      const course = MOCK_COURSES.find((c) => c.id === params.courseId);
      const sem = course?.semester || params.semester;
      const dept = course?.departmentCode || params.departmentCode;

      recipients = recipients.filter(
        (u) =>
          u.role === "student" &&
          (!dept || u.departmentCode === dept) &&
          (!sem || u.semester === sem) &&
          (!params.section || u.section === params.section)
      );
      break;
  }

  return recipients.map((r) => ({
    institutionalUserId: r.id,
    fullName: r.fullName,
    role: r.role as any,
  }));
}

/**
 * Determines whether a faculty member can access a student-submitted document.
 */
export function canFacultyAccessStudentSubmission(
  facultyContext: UserAuthContext,
  studentBiodata: {
    courseId?: string;
    departmentCode?: string;
    programCode?: string;
    academicYear?: number;
    semester?: number;
    section?: string;
  }
): boolean {
  if (facultyContext.role === "admin") return true;
  if (facultyContext.role !== "faculty") return false;

  const isHod = hasTag(facultyContext, "HOD");
  const facultyDept = facultyContext.departmentCode || "CSE";

  // HOD has access within their department
  if (isHod && studentBiodata.departmentCode === facultyDept) {
    return true;
  }

  const assignments = getFacultyAssignmentsForUser(facultyContext);

  // If assignment is for this course
  if (studentBiodata.courseId) {
    const isCourseCoord = assignments.some(
      (a) => a.assignmentType === "course" && a.courseId === studentBiodata.courseId
    );
    if (isCourseCoord) return true;
  }

  // If assignment is for this class
  const isClassCoord = assignments.some(
    (a) =>
      a.assignmentType === "class" &&
      a.departmentCode === studentBiodata.departmentCode &&
      (!studentBiodata.academicYear || a.academicYear === studentBiodata.academicYear) &&
      (!studentBiodata.semester || a.semester === studentBiodata.semester) &&
      (!studentBiodata.section || a.section === studentBiodata.section)
  );
  if (isClassCoord) {
    return true;
  }

  return false;
}
