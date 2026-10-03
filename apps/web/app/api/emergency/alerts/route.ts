import { NextRequest, NextResponse } from "next/server";
import { emergencyService } from "@/lib/emergency/emergency-service";
import { CreateEmergencyAlertInputSchema } from "@smart-campus/contracts";

export async function GET() {
  try {
    const alerts = emergencyService.getAllAlerts();
    const active = emergencyService.getActiveAlerts();
    const hotlines = emergencyService.getHotlines();

    return NextResponse.json({
      success: true,
      alerts,
      active,
      hotlines,
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
    const parsed = CreateEmergencyAlertInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const alert = emergencyService.broadcastAlert(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Broadcast dispatched across channels: ${parsed.data.channels.join(", ").toUpperCase()}`,
      alert,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
