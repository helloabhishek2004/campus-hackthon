import { NextRequest, NextResponse } from "next/server";
import { RequestOtpRequestSchema } from "@smart-campus/contracts";
import { requestLoginOtp } from "@/lib/auth/identity-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestOtpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { institutionalId } = parsed.data;
    const response = await requestLoginOtp(institutionalId);

    return NextResponse.json(response);
  } catch (error: any) {
    const isNotFound = error?.message?.includes("not found");
    return NextResponse.json(
      {
        error: error?.message || "Failed to dispatch OTP challenge.",
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
