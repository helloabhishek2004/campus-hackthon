import { NextRequest, NextResponse } from "next/server";
import { saveClaimAnswers } from "../../../../../../lib/lost-found/repository";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { ClaimWorkflowError } from "@smart-campus/lost-and-found";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const identity = await requireLostFoundIdentity();
  if (!isIdentity(identity)) return identity;
  const body = await req.json().catch(() => ({}));
  try {
    const claim = await saveClaimAnswers(id, identity.userId, body?.answers ?? body);
    if (!claim) return NextResponse.json({ success: false, error: { message: "Claim not found" } }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof ClaimWorkflowError ? error.message : "Verification answers could not be saved" } }, { status: error instanceof ClaimWorkflowError ? error.status : 500 });
  }
  return NextResponse.json(
    {
      success: true,
      claimId: id,
      message: "Claim verification answers saved.",
    },
    { status: 200 },
  );
}
