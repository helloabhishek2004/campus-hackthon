import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { getFacultyAssignmentsForUser } from "@/lib/faculty/faculty-academic-permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const assignments = getFacultyAssignmentsForUser(user);

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve faculty assignments." },
      { status: 500 }
    );
  }
}
