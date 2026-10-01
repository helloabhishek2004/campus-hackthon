import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { facultyAcademicService } from "@/lib/faculty/faculty-academic-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const { id } = await params;
    const document = await facultyAcademicService.getDocumentById(user, id);

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve academic document." },
      { status }
    );
  }
}
