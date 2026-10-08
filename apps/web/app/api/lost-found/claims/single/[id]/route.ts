import { NextRequest, NextResponse } from "next/server";
import { getClaim } from "@/lib/lost-found/repository";
import { canAccessClaim, isIdentity, publicItem, requireLostFoundIdentity } from "../../../_auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const loaded = await getClaim(id); const claim = loaded?.claim as any;
    if (!claim) return NextResponse.json({ success: false, error: { message: "Claim not found" } }, { status: 404 });
    
    const item = loaded?.item as any;
    if (!item || (claim.claimant_id !== identity.userId && item.reporter_id !== identity.userId && identity.profile?.role !== "admin")) {
      return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
    }

    return NextResponse.json({ 
        success: true, 
        claim: {
            ...claim,
            item: publicItem(item, item.lost_found_item_images || [])
        }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
