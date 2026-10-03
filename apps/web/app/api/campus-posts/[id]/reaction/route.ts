import { NextRequest, NextResponse } from "next/server";
import { ReactCampusPostRequestSchema } from "@smart-campus/contracts";
import { reactToCampusPost } from "@/lib/campus-posts/campus-post-service";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveUserContextFromRequest(req);
    const body = await req.json();

    const parsed = ReactCampusPostRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reaction payload." },
        { status: 400 }
      );
    }

    const result = await reactToCampusPost(id, user, parsed.data.reaction);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update reaction." },
      { status: 400 }
    );
  }
}
