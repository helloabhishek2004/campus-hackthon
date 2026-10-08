import { NextRequest, NextResponse } from "next/server";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { getMatch, publicItem as projectItem } from "@/lib/lost-found/repository";

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

    const { lost: _lost, found: _found, ...safeMatch } = match as any;
    return NextResponse.json({
      success: true,
      match: {
        ...safeMatch,
        lost_item: projectItem(match.lost, match.lost.lost_found_item_images || []),
        found_item: projectItem(match.found, match.found.lost_found_item_images || []),
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Match read failed" } }, { status: 500 });
  }
}
