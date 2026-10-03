import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { facultyAcademicService } from "@/lib/faculty/faculty-academic-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const { id } = await params;
    const result = await facultyAcademicService.markAsRead(user, id);

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to mark document as read." },
      { status }
    );
  }
}
