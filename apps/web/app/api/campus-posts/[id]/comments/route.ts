import { NextRequest, NextResponse } from "next/server";
import { CreateCampusPostCommentRequestSchema } from "@smart-campus/contracts";
import {
  getCampusPostComments,
  addCampusPostComment,
} from "@/lib/campus-posts/campus-post-service";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveUserContextFromRequest(req);
    const comments = await getCampusPostComments(id, user);

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve comments." },
      { status: 403 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveUserContextFromRequest(req);
    const body = await req.json();

    const parsed = CreateCampusPostCommentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const comment = await addCampusPostComment(id, user, parsed.data.content);

    return NextResponse.json({
      success: true,
      comment,
      message: "Comment added successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to post comment." },
      { status: 400 }
    );
  }
}
