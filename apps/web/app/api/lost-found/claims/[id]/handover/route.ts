import { NextRequest, NextResponse } from "next/server";
import { HandoverSchema } from "@smart-campus/contracts";
import { handoverClaim } from "../../../../../../lib/lost-found/repository";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";
import { ClaimWorkflowError } from "@smart-campus/lost-and-found";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const body = await req.json().catch(() => ({}));
    const validation = HandoverSchema.safeParse({
      ...body,
      claim_id: id,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { message: "Select a valid handover mode", details: validation.error.format() } },
        { status: 400 },
      );
    }

    const claim = await handoverClaim(id, identity.userId, validation.data.mode);
    if (!claim) return NextResponse.json({ success: false, error: { message: "Claim not found" } }, { status: 404 });

    return NextResponse.json(
      {
        success: true,
        claimId: id,
        handoverMode: validation.data.mode,
        message: "Handover confirmed. Both linked item reports are resolved.",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof ClaimWorkflowError ? error.message : "Handover could not be recorded" },
      },
      { status: error instanceof ClaimWorkflowError ? error.status : 500 },
    );
  }
}
