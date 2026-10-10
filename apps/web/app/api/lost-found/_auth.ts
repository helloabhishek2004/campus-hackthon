import { NextResponse } from "next/server";
import { resolveServerIdentity, type ServerIdentity } from "../../../lib/auth/server-identity";
import { ClaimSchema } from "@smart-campus/contracts";
import { canReleaseContactInfo, isClaimReviewable, validateClaimAnswers } from "@smart-campus/lost-and-found";

export async function requireLostFoundIdentity(): Promise<ServerIdentity | NextResponse> {
  const identity = await resolveServerIdentity({ allowDemo: true });
  if (!identity) return NextResponse.json({ success: false, error: { message: "Authentication required" } }, { status: 401 });
  return identity;
}

export function isIdentity(value: ServerIdentity | NextResponse): value is ServerIdentity {
  return !(value instanceof NextResponse);
}

export function publicItem(item: any, images: any[] = []) {
  return {
    id: item.id, type: item.type, category: item.category, subcategory: item.subcategory,
    title: item.title, public_description: item.public_description,
    location_id: item.location_id, location_description: item.location_description,
    event_date: item.event_date, status: item.status, is_sensitive: item.is_sensitive,
    created_at: item.created_at,
    images: images.filter((image) => !image.is_sensitive).map(({ storage_path: _storage, ...safe }) => safe),
  };
}

export function canOperate(identity: ServerIdentity, item: any) {
  return item.reporter_id === identity.userId || identity.profile?.role === "admin" ||
    ["HOD", "DEPARTMENT_COORDINATOR", "CAS_COORDINATOR"].some((tag) => identity.profile?.tags?.includes(tag as any));
}

/** Capability flags convey ownership without adding reporter identity to public items. */
export function itemViewerCapabilities(identity: ServerIdentity, item: any) {
  return {
    isReporter: item.reporter_id === identity.userId,
    canManage: canOperate(identity, item),
    canViewMatches: item.reporter_id === identity.userId || identity.profile?.role === "admin",
  };
}

export function canViewClaim(identity: ServerIdentity, claim: any, item: any) {
  return Boolean(item && (claim.claimant_id === identity.userId || canOperate(identity, item)));
}

export function claimViewerCapabilities(identity: ServerIdentity, claim: any, item: any) {
  const isClaimant = claim.claimant_id === identity.userId;
  const reviewable = isClaimReviewable(claim.status) && item?.status === "in_claim";
  const canDecide = Boolean(item && !isClaimant && canOperate(identity, item) && reviewable);
  const contact = canReleaseContactInfo(
    { userId: identity.userId, role: identity.profile?.role === "admin" ? "admin" : "student" },
    { ...claim, finder_id: item?.reporter_id },
    claim.contact_window_expires_at ? new Date(claim.contact_window_expires_at) : null,
  );
  return {
    isClaimant,
    isFinder: item?.reporter_id === identity.userId,
    canAnswer: isClaimant && reviewable,
    canDecide,
    canApprove: canDecide && validateClaimAnswers(claim.verification_answers).isValid,
    canHandover: isClaimant && claim.status === "approved" && item?.status === "handover",
    canRevealContact: contact.isAuthorized,
  };
}

/** Explicit projection prevents joined match/item records leaking concealed evidence. */
export function publicClaim(claim: any, item: any) {
  const answers = ClaimSchema.shape.verification_answers.safeParse(claim.verification_answers);
  return {
    id: claim.id,
    item_id: claim.item_id,
    match_id: claim.match_id ?? null,
    status: claim.status,
    claim_text: claim.claim_text,
    verification_answers: answers.success ? answers.data : [],
    decision_notes: claim.decision_notes ?? null,
    decided_at: claim.decided_at ?? null,
    handover_mode: claim.handover_mode ?? null,
    created_at: claim.created_at,
    updated_at: claim.updated_at,
    item: publicItem(item, item.lost_found_item_images ?? []),
  };
}

export function canAdministerLostFound(identity: ServerIdentity) {
  return identity.profile?.role === "admin" ||
    ["HOD", "DEPARTMENT_COORDINATOR", "CAS_COORDINATOR"].some((tag) => identity.profile?.tags?.includes(tag as any));
}

export function canViewPrivate(identity: ServerIdentity, item: any) {
  return canOperate(identity, item) || item.reporter_id === identity.userId;
}

export function canAccessMatch(identity: ServerIdentity, match: any, db: any) {
  const lost = db.lost_found_items.find((item: any) => item.id === match.lost_item_id);
  const found = db.lost_found_items.find((item: any) => item.id === match.found_item_id);
  return Boolean(lost && found && (canOperate(identity, lost) || canOperate(identity, found)));
}

export function canAccessClaim(identity: ServerIdentity, claim: any, db: any) {
  const item = db.lost_found_items.find((entry: any) => entry.id === claim.item_id);
  return Boolean(
    item &&
      (claim.claimant_id === identity.userId ||
        claim.finder_id === identity.userId ||
        canOperate(identity, item)),
  );
}
