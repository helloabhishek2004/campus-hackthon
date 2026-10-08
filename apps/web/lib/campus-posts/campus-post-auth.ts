import { NextRequest } from "next/server";
import { resolveServerIdentity } from "../auth/server-identity";
import { UserAuthContext } from "./campus-post-permissions";

/**
 * Resolves authenticated user context from request header, auth session, or fallback directory.
 * Never trusts arbitrary client-supplied author IDs.
 */
export async function resolveUserContextFromRequest(
  _req: NextRequest
): Promise<UserAuthContext> {
  const identity = await resolveServerIdentity({ allowDemo: true });
  if (identity?.profile) {
    return {
      id: identity.userId,
      role: identity.profile.role,
      fullName: identity.profile.fullName,
      institutionalId: identity.profile.institutionalId,
      departmentCode: identity.profile.departmentCode,
      programCode: identity.profile.programCode,
      academicYear: identity.profile.academicYear,
      semester: identity.profile.semester,
      section: identity.profile.section,
      tags: identity.profile.tags,
    };
  }
  throw new Error("Unauthenticated campus request");
}
