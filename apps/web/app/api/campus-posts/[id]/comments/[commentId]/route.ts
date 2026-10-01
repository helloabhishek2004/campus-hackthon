import { NextRequest, NextResponse } from "next/server";
import { deleteCampusPostComment } from "@/lib/campus-posts/campus-post-service";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const user = await resolveUserContextFromRequest(req);
    await deleteCampusPostComment(commentId, user);

    return NextResponse.json({
      success: true,
      message: "Comment removed successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to remove comment." },
      { status: 403 }
    );
  }
}
