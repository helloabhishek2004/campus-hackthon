export function approvalsOk(
  scope: "responders_only" | "audience" | "campus_wide",
  approvers: { id: number; role: string }[],
) {
  // If only responders are being alerted, one approver is sufficient.
  if (scope === "responders_only") {
    return approvers.length >= 1;
  }

  // Check if any of the approvers is the security head or admin.
  const hasHead = approvers.some(a => a.role === "security_head" || a.role === "admin");
  
  // Count distinct approvers by their ID.
  const distinct = new Set(approvers.map(a => a.id)).size;
  
  // A broader alert requires either the security head/admin, or two distinct responders.
  return hasHead || distinct >= 2;
}
