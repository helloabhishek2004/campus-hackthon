import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { facultyAcademicService } from "@/lib/faculty/faculty-academic-service";
import { ReviewStudentSubmissionRequestSchema } from "@smart-campus/contracts";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const validated = ReviewStudentSubmissionRequestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const submission = await facultyAcademicService.reviewStudentSubmission(
      user,
      id,
      validated.data
    );

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to review student submission." },
      { status }
    );
  }
}
