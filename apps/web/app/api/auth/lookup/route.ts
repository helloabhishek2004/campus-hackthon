import { NextRequest, NextResponse } from "next/server";
import { InstitutionalLookupRequestSchema } from "@smart-campus/contracts";
import { lookupInstitutionalIdentity } from "@/lib/auth/identity-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = InstitutionalLookupRequestSchema.safeParse(body);

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
    const profile = await lookupInstitutionalIdentity(institutionalId);

    if (!profile) {
      return NextResponse.json(
        {
          error: "Institutional ID not found in records.",
          institutionalId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal server error during identity lookup.",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
