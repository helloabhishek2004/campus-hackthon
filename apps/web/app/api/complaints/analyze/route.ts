import { NextRequest, NextResponse } from "next/server";
import { analyzeComplaint } from "@smart-campus/complaint-intelligence";
import {
  ComplaintAnalysisRequestSchema,
  ComplaintAnalysisResponse,
} from "@smart-campus/contracts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate payload against contract schema
    const parsed = ComplaintAnalysisRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errorResponse: ComplaintAnalysisResponse = {
        success: false,
        complaint_id: body?.complaint_id || "unknown",
        processing: {
          status: "failed",
          processed_at: new Date().toISOString(),
        },
        error: {
          code: "VALIDATION_ERROR",
          message: "Request does not meet ComplaintAnalysisRequest schema",
          details: parsed.error.format(),
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call Module 2 intelligence processor
    const response: ComplaintAnalysisResponse = await analyzeComplaint(
      parsed.data,
    );

    return NextResponse.json(response, {
      status: response.success ? 200 : 500,
    });
  } catch (error) {
    const errorResponse: ComplaintAnalysisResponse = {
      success: false,
      complaint_id: "unknown",
      processing: {
        status: "failed",
        processed_at: new Date().toISOString(),
      },
      error: {
        code: "SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Internal server error occurred",
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
