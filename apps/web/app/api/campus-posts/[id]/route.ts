import { NextRequest, NextResponse } from "next/server";
import { getPostById } from "@/lib/campus-posts/campus-post-service";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveUserContextFromRequest(req);
    const post = await getPostById(id, user);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve post." },
      { status: 500 }
    );
  }
}
