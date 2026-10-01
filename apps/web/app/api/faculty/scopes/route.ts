import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { getAuthorizedScopeOptions } from "@/lib/faculty/faculty-academic-permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const scopes = getAuthorizedScopeOptions(user);

    return NextResponse.json({
      success: true,
      scopes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve authorized scopes." },
      { status: 500 }
    );
  }
}
