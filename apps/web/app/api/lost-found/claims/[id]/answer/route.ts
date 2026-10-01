import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(
    {
      success: true,
      claimId: id,
      message: "Claim verification answers submitted successfully.",
    },
    { status: 200 },
  );
}
