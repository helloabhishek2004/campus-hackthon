import { NextRequest, NextResponse } from "next/server";
import { HandoverSchema } from "@smart-campus/contracts";
import { handoverClaim } from "@/lib/lost-found/repository";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const body = await req.json();
    const validation = HandoverSchema.safeParse({
      claim_id: id,
      ...body,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 },
      );
    }

    const claim = await handoverClaim(id, identity.userId, validation.data.mode);
    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });

    return NextResponse.json(
      {
        success: true,
        claimId: id,
        handoverMode: validation.data.mode,
         message: "Handover recorded. Complete the exchange through the selected campus process.",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error",
      },
      { status: 500 },
    );
  }
}
