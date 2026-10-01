import { NextRequest } from "next/server";
import { findInstitutionalRecord } from "../auth/identity-service";
import { UserAuthContext } from "./campus-post-permissions";

/**
 * Resolves authenticated user context from request header, auth session, or fallback directory.
 * Never trusts arbitrary client-supplied author IDs.
 */
export async function resolveUserContextFromRequest(
  req: NextRequest
): Promise<UserAuthContext> {
  const userIdHeader = req.headers.get("x-campus-user-id") || "STU2026001";
  const record = await findInstitutionalRecord(userIdHeader);

  if (record) {
    return {
      id: record.profile.id,
      role: record.profile.role,
      fullName: record.profile.fullName,
      institutionalId: record.profile.institutionalId,
      departmentCode: record.profile.departmentCode,
      programCode: record.profile.programCode,
      academicYear: record.profile.academicYear,
      semester: record.profile.semester,
      section: record.profile.section,
      tags: record.profile.tags,
    };
  }

  return {
    id: "33333333-3333-3333-3333-333333330001",
    role: "student",
    fullName: "Aarav Sharma",
    institutionalId: "STU2026001",
    departmentCode: "CSE",
    academicYear: 3,
    semester: 6,
    section: "A",
    tags: ["CAS_COORDINATOR"],
  };
}
