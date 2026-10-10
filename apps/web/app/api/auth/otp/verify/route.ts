import { NextRequest, NextResponse } from "next/server";
import { VerifyOtpRequestSchema } from "@smart-campus/contracts";
import {
  MOCK_SESSION_COOKIE_NAME,
  MOCK_SESSION_MAX_AGE_SECONDS,
  verifyLoginOtp,
} from "../../../../../lib/auth/identity-service";

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

    const { sessionToken, ...clientResponse } = response;
    const result = NextResponse.json(clientResponse);
    if (sessionToken) {
      result.cookies.set(MOCK_SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: MOCK_SESSION_MAX_AGE_SECONDS,
      });
    }
    return result;
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Internal server error verifying OTP.",
      },
      { status: 500 }
    );
  }
}
