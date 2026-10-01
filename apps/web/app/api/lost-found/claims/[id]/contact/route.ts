import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Boundary check: In full implementation, verifies claim status === 'approved',
  // verifies caller is claimant/finder, checks contact window expiry, and writes to contact_reveals audit table.
  return NextResponse.json(
    {
      success: false,
      claimId: id,
      error: {
        code: "UNAUTHORIZED_CONTACT_ACCESS",
        message:
          "Contact details release requires approved claim and active handover consent window.",
      },
    },
    { status: 403 },
  );
}
