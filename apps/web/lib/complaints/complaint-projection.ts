import type { ComplaintRecord } from "@smart-campus/contracts";

/**
 * Complaint responses do not need database identity columns. Keep status and
 * response notes visible to the owner/staff while removing raw actor IDs from
 * every browser-facing projection.
 */
export function projectComplaintForApi(
  complaint: ComplaintRecord,
): Omit<ComplaintRecord, "complainant_id" | "assigned_to" | "last_updated_by"> {
  const {
    complainant_id: _complainantId,
    assigned_to: _assignedTo,
    last_updated_by: _lastUpdatedBy,
    ...safeComplaint
  } = complaint;
  return safeComplaint;
}
