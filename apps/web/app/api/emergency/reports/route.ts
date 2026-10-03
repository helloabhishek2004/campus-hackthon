import { NextRequest, NextResponse } from "next/server";
import { emergencyService } from "@/lib/emergency/emergency-service";
import { CreateEmergencyReportInputSchema } from "@smart-campus/contracts";

export async function GET() {
  try {
    const reports = emergencyService.getReports();
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
    const json = await req.json();
    const parsed = CreateEmergencyReportInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const report = emergencyService.createReport(parsed.data, {
      fullName: parsed.data.reporter_name || "Campus User",
    });

    return NextResponse.json({
      success: true,
      message: `Emergency SOS report filed. Reference: ${report.public_ref}. Rapid responders dispatched.`,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
