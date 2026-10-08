import { NextRequest, NextResponse } from "next/server";
import { emergencyService } from "@/lib/emergency/emergency-service";
import { CreateEmergencyReportInputSchema } from "@smart-campus/contracts";
import { resolveServerIdentity } from "@/lib/auth/server-identity";
import { canViewAllEmergencyReports } from "@/lib/emergency/emergency-permissions";

export async function GET() {
  try {
    const identity = await resolveServerIdentity({ allowDemo: true });
    if (!identity) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const canViewAll = canViewAllEmergencyReports(identity.profile);
    const reports = await emergencyService.getReports({
      userId: identity.userId,
      fullName: identity.profile?.fullName || "Authenticated Campus User",
      profileId: identity.userId,
    }, canViewAll);
    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await resolveServerIdentity({ allowDemo: true });
    if (!identity) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const json = await req.json();
    const parsed = CreateEmergencyReportInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const report = await emergencyService.createReport(parsed.data, {
      userId: identity.userId,
      fullName: identity.profile?.fullName || "Authenticated Campus User",
      profileId: identity.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Emergency SOS report recorded. Reference: ${report.public_ref}. Campus response is simulated; call a hotline for immediate assistance.`,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
