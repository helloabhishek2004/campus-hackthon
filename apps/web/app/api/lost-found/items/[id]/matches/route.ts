import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(
    {
      success: true,
      itemId: id,
      matches: [],
      note: "Candidate similarity matching boundary established. Awaiting worker pipeline implementation.",
    },
    { status: 200 },
  );
}
