import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { facultyAcademicService } from "@/lib/faculty/faculty-academic-service";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const overview = await facultyAcademicService.getDashboardOverview(user);

    return NextResponse.json({
      success: true,
      overview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve faculty dashboard overview." },
      { status: 500 }
    );
  }
}
