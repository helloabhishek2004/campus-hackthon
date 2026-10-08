import { NextRequest, NextResponse } from "next/server";
import { decideClaim, getClaim } from "@/lib/lost-found/repository";
import { canAccessClaim, canOperate, isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { decision, notes } = await req.json();
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const loaded = await getClaim(id); const claim = loaded?.claim as any;
    if (!claim) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });
    
    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ success: false, error: { message: "Decision must be approved or rejected" } }, { status: 400 });
    }
    const item = loaded?.item; const found = item;
    if (!item || claim.claimant_id === identity.userId || !canOperate(identity, found)) {
      return NextResponse.json({ success: false, error: { message: "Only an authorized finder or staff member can decide this claim" } }, { status: 403 });
    }
    const updated = await decideClaim(id, identity.userId, decision, typeof notes === "string" ? notes.slice(0, 2000) : undefined);
    return NextResponse.json({ success: true, claim: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
