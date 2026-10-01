import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(
    {
      success: true,
      matchId: id,
      message: "Match claim initiation boundary established.",
      status: "pending",
    },
    { status: 200 },
  );
}
