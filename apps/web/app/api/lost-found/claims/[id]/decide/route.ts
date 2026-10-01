import { NextRequest, NextResponse } from "next/server";
import { ClaimDecisionSchema } from "@smart-campus/contracts";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const validation = ClaimDecisionSchema.safeParse({
      claim_id: id,
      ...body,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        claimId: id,
        decision: validation.data.decision,
        message: "Claim decision recorded successfully.",
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
