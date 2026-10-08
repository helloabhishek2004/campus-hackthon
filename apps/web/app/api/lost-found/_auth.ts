import { NextResponse } from "next/server";
import { resolveServerIdentity, type ServerIdentity } from "../../../lib/auth/server-identity";

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
