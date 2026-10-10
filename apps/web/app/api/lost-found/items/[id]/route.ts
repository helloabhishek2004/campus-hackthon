import { NextRequest, NextResponse } from "next/server";
import { canOperate, isIdentity, itemViewerCapabilities, requireLostFoundIdentity } from "../../_auth";
import { getItem, getItemClaimSummaries } from "../../../../../lib/lost-found/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const { id } = await params;
    const result = await getItem(id);
    if (!result) {
      return NextResponse.json({ success: false, error: { message: "Item not found" } }, { status: 404 });
    }
    
    const claims = canOperate(identity, result.row) ? await getItemClaimSummaries(result.row, identity.userId) : [];
    return NextResponse.json({ success: true, item: result.public, capabilities: itemViewerCapabilities(identity, result.row), claims }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Lost & Found read failed" } }, { status: 500 });
  }
}
