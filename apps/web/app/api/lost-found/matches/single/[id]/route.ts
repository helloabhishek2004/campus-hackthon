import { NextRequest, NextResponse } from "next/server";
import { canViewClaim, isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { getActiveClaimForMatch, getMatch, publicItem as projectItem } from "../../../../../../lib/lost-found/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const match = await getMatch(id);
    if (!match) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });
    if (!match.lost || !match.found || ![match.lost.reporter_id, match.found.reporter_id].includes(identity.userId) && identity.profile?.role !== "admin") return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });

    const activeClaim = await getActiveClaimForMatch(id);
    const canClaim = match.lost.reporter_id === identity.userId && match.found.reporter_id !== identity.userId &&
      match.lost.type === "lost" && match.found.type === "found" && match.lost.status === "open" &&
      match.found.status === "open" && !match.is_dismissed && !activeClaim;
    return NextResponse.json({
      success: true,
      capabilities: { canClaim },
      existingClaimId: activeClaim && canViewClaim(identity, activeClaim, match.found) ? activeClaim.id : null,
      match: {
        id: match.id, lost_item_id: match.lost_item_id, found_item_id: match.found_item_id,
        overall_score: match.overall_score, match_band: match.match_band,
        score_breakdown: match.score_breakdown, is_dismissed: match.is_dismissed,
        created_at: match.created_at,
        lost_item: projectItem(match.lost, match.lost.lost_found_item_images || []),
        found_item: projectItem(match.found, match.found.lost_found_item_images || []),
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Match read failed" } }, { status: 500 });
  }
}
