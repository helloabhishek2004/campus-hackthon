import { NextRequest, NextResponse } from "next/server";
import { decideClaim, getClaim } from "../../../../../../lib/lost-found/repository";
import { canOperate, isIdentity, publicClaim, requireLostFoundIdentity } from "../../../_auth";
import { ClaimWorkflowError, validateClaimDecision } from "@smart-campus/lost-and-found";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const body = await req.json().catch(() => ({}));
    const validation = validateClaimDecision({ ...body, claim_id: id });
    if (!validation.isValid) return NextResponse.json({ success: false, error: { message: validation.errors.join(" ") } }, { status: 400 });
    const { decision, notes } = validation.data;
    const loaded = await getClaim(id); const claim = loaded?.claim as any;
    if (!claim) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });
    
    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ success: false, error: { message: "Decision must be approved or rejected" } }, { status: 400 });
    }
    const item = loaded?.item; const found = item;
    if (!item || claim.claimant_id === identity.userId || !canOperate(identity, found)) {
      return NextResponse.json({ success: false, error: { message: "Only an authorized finder or staff member can decide this claim" } }, { status: 403 });
    }
    const updated = await decideClaim(id, identity.userId, decision as "approved" | "rejected", notes?.slice(0, 2000));
    if (!updated) return NextResponse.json({ success: false, error: { message: "Claim not found" } }, { status: 404 });
    return NextResponse.json({ success: true, claim: publicClaim(updated, { ...item, status: decision === "approved" ? "handover" : "open" }) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof ClaimWorkflowError ? error.message : "Internal error" } }, { status: error instanceof ClaimWorkflowError ? error.status : 500 });
  }
}
