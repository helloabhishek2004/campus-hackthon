import { NextRequest, NextResponse } from "next/server";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { getMatchesForItem, publicItem as projectItem } from "@/lib/lost-found/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const { id } = await params;
    const matches = await getMatchesForItem(id);
    
    // Join items
    const enrichedMatches = matches
      .filter((m: any) => Boolean(m.lost && m.found && (m.lost.reporter_id === identity.userId || m.found.reporter_id === identity.userId || identity.profile?.role === "admin")))
      .map((m: any) => {
        const { lost: _lost, found: _found, ...safeMatch } = m;
        return {
          ...safeMatch,
          lost_item: projectItem(m.lost, m.lost.lost_found_item_images || []),
          found_item: projectItem(m.found, m.found.lost_found_item_images || []),
        };
      });

    return NextResponse.json({ success: true, matches: enrichedMatches }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Match read failed" } }, { status: 500 });
  }
}
