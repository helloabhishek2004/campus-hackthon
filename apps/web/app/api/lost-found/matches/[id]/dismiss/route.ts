import { NextRequest, NextResponse } from "next/server";
import { canOperate, isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { dismissMatch, getMatch } from "@/lib/lost-found/repository";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const identity = await requireLostFoundIdentity();
  if (!isIdentity(identity)) return identity;
  const current = await getMatch(id) as any;
  if (!current) return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
  const isParty = [current.lost?.reporter_id, current.found?.reporter_id].includes(identity.userId);
  if (!isParty && !canOperate(identity, current.lost) && !canOperate(identity, current.found)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const match = await dismissMatch(id, identity.userId);
  if (!match) return NextResponse.json({ success: false, error: "Match not found or already dismissed" }, { status: 404 });
  return NextResponse.json(
    {
      success: true,
      matchId: id,
       message: "Match dismissed and saved.",
      isDismissed: true,
    },
    { status: 200 },
  );
}
