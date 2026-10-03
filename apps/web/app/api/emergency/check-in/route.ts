import { NextRequest, NextResponse } from "next/server";
import { emergencyService } from "@/lib/emergency/emergency-service";
import { SafetyCheckInSchema } from "@smart-campus/contracts";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = SafetyCheckInSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid check-in data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = emergencyService.recordSafetyCheckIn(parsed.data);

    return NextResponse.json({
      success: true,
      message: parsed.data.status === "safe" ? "Marked as safe" : "Assistance requested. Responders notified.",
      totalSafe: result.totalSafe,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
