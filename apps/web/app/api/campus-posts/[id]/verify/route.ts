import { NextRequest, NextResponse } from "next/server";
import { VerifyCampusPostRequestSchema } from "@smart-campus/contracts";
import { verifyCampusPost } from "@/lib/campus-posts/campus-post-service";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveUserContextFromRequest(req);
    const body = await req.json();

    const parsed = VerifyCampusPostRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const post = await verifyCampusPost(id, user, parsed.data);

    return NextResponse.json({
      success: true,
      post,
      message: `Post marked as ${parsed.data.status}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to verify post." },
      { status: 403 }
    );
  }
}
