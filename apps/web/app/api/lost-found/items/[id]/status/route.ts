import { NextRequest, NextResponse } from "next/server";
import { LostFoundItemStatusSchema } from "@smart-campus/contracts";
import { canTransition } from "@smart-campus/lost-and-found";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const nextStatus = LostFoundItemStatusSchema.safeParse(body?.status);

    if (!nextStatus.success) {
      return NextResponse.json(
        { success: false, error: "Invalid item status value" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Status transition boundary for item ${id} established.`,
        requestedStatus: nextStatus.data,
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
