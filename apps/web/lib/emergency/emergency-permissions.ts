import type { InstitutionalLookupResponse } from "@smart-campus/contracts";

const responderRoles = ["admin", "faculty", "staff"];
const broadcastRoles = ["admin", "faculty", "staff"];
const coordinatorTags = ["HOD", "CAS_COORDINATOR", "DEPARTMENT_COORDINATOR"];

export function canViewAllEmergencyReports(profile?: InstitutionalLookupResponse | null): boolean {
  return Boolean(profile && (responderRoles.includes(profile.role) || profile.tags.some((tag) => ["HOD", "DEPARTMENT_COORDINATOR"].includes(tag))));
}

export function canCreateEmergencyBroadcast(profile?: InstitutionalLookupResponse | null): boolean {
  return Boolean(
    profile &&
      (broadcastRoles.includes(profile.role) || profile.tags.some((tag) => coordinatorTags.includes(tag))),
  );
}
