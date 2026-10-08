import { NextRequest, NextResponse } from "next/server";
import { getMatch, createClaim } from "@/lib/lost-found/repository";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const body = await req.json().catch(() => ({}));
    const match = await getMatch(id);
    if (!match) return NextResponse.json({ success: false, error: { message: "Match not found" } }, { status: 404 });
    
    const lostItem = (match as any).lost; const foundItem = (match as any).found;
    if (!lostItem || !foundItem) return NextResponse.json({ success: false, error: { message: "Matched items not found" } }, { status: 404 });
    if (lostItem.reporter_id !== identity.userId) {
      return NextResponse.json({ success: false, error: { message: "Only the lost-item reporter can initiate this claim" } }, { status: 403 });
    }
    const claim = await createClaim({ matchId: id, claimantId: identity.userId, claimText: typeof body?.claimText === "string" && body.claimText.trim().length >= 5
          ? body.claimText.trim()
           : "Claim initiated through the authenticated CampusGram flow." });
    if (!claim) return NextResponse.json({ success: false, error: { message: "Unable to create claim" } }, { status: 404 });

    return NextResponse.json({ success: true, claim }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    if (message.includes("claim already exists")) {
      return NextResponse.json({ success: false, error: { message } }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
