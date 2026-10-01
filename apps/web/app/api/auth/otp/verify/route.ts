import { NextRequest, NextResponse } from "next/server";
import { VerifyOtpRequestSchema } from "@smart-campus/contracts";
import { verifyLoginOtp } from "@/lib/auth/identity-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { institutionalId, otp } = parsed.data;
    const response = await verifyLoginOtp(institutionalId, otp);

    if (!response.success) {
      return NextResponse.json(
        {
          error: response.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Internal server error verifying OTP.",
      },
      { status: 500 }
    );
  }
}
