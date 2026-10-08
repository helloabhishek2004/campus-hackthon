import { NextRequest, NextResponse } from "next/server";
import { emergencyService } from "@/lib/emergency/emergency-service";
import { SafetyCheckInSchema } from "@smart-campus/contracts";
import { resolveServerIdentity } from "@/lib/auth/server-identity";

export async function POST(req: NextRequest) {
  try {
    const identity = await resolveServerIdentity({ allowDemo: true });
    if (!identity) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const json = await req.json();
    const parsed = SafetyCheckInSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid check-in data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await emergencyService.recordSafetyCheckIn({ ...parsed.data, user_id: identity.userId }, {
      userId: identity.userId,
      fullName: identity.profile?.fullName || "Authenticated Campus User",
      profileId: identity.userId,
    });

    return NextResponse.json({
      success: true,
       message: parsed.data.status === "safe" ? "Safety status recorded." : "Assistance request recorded. Campus response is simulated; call a hotline if urgent.",
      totalSafe: result.totalSafe,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
