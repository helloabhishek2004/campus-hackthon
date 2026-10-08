import { NextRequest, NextResponse } from "next/server";
import { saveClaimAnswers } from "@/lib/lost-found/repository";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const identity = await requireLostFoundIdentity();
  if (!isIdentity(identity)) return identity;
   const body = await req.json().catch(() => ({}));
   try { const claim = await saveClaimAnswers(id, identity.userId, body?.answers ?? body); if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 }); } catch (e) { return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Forbidden" }, { status: 403 }); }
  return NextResponse.json(
    {
      success: true,
      claimId: id,
      message: "Claim verification answers saved.",
    },
    { status: 200 },
  );
}
