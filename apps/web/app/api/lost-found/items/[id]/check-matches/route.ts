import { NextRequest, NextResponse } from "next/server";
import { canOperate, isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { getItem, getMatchesForItem, publicItem } from "@/lib/lost-found/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const { id } = await params;
    const itemResult = await getItem(id);
    if (!itemResult) {
      return NextResponse.json({ success: false, found: false, status: "not_found" }, { status: 404 });
    }
    if (!canOperate(identity, itemResult.row)) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });

    // Still processing — worker hasn't finished yet
    if (itemResult.row.status === "processing") {
      return NextResponse.json({ success: true, found: false, status: "processing" });
    }

    // Find matches for this item
    const matches = await getMatchesForItem(id);

    if (matches.length === 0) {
      return NextResponse.json({ success: true, found: false, status: "no_match" });
    }

    // Get the best match by score
    const bestMatch = [...matches].filter((m: any) => !m.is_dismissed).sort((a: any, b: any) => b.overall_score - a.overall_score)[0];
    if (!bestMatch) return NextResponse.json({ success: true, found: false, status: "no_match" });

    // Get the matched item (the counterpart)
    const matchedItem = bestMatch.lost_item_id === id ? bestMatch.found : bestMatch.lost;

    return NextResponse.json({
      success: true,
      found: true,
      status: "match_found",
      match: {
        id: bestMatch.id,
        score: Math.round(bestMatch.overall_score * 100),
        band: bestMatch.match_band,
         matchedItem: matchedItem ? publicItem(matchedItem, matchedItem.lost_found_item_images || []) : null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Match read failed" } }, { status: 500 });
  }
}
