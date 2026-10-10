import type { InstitutionalLookupResponse } from "@smart-campus/contracts";

export function canManageComplaints(
  profile?: InstitutionalLookupResponse | null,
): boolean {
  return Boolean(
    profile &&
      (["admin", "faculty", "staff"].includes(profile.role) ||
        profile.tags.some((tag) =>
          ["HOD", "DEPARTMENT_COORDINATOR"].includes(tag),
        )),
  );
}
