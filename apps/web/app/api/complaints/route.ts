import { NextRequest, NextResponse } from "next/server";
import {
  CreateComplaintRequestSchema,
  ComplaintListQuerySchema,
  CreateComplaintResponse,
  ComplaintListResponse,
} from "@smart-campus/contracts";
import {
  createComplaint,
  getComplaints,
} from "../../../lib/complaints/complaint-repository";

/**
 * GET /api/complaints
 * Returns list of complaints filtered by view (all | normal | emergency).
 * Each complaint reflects its group count and real-time emergency classification.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const viewParam = searchParams.get("view") || "all";

    const parsedQuery = ComplaintListQuerySchema.safeParse({ view: viewParam });
    const view = parsedQuery.success ? parsedQuery.data.view : "all";

    const { complaints, counts } = await getComplaints(view);

    const response: ComplaintListResponse = {
      success: true,
      complaints,
      counts,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("GET /api/complaints error:", error);
    const errorResponse: ComplaintListResponse = {
      success: false,
      complaints: [],
      counts: { total: 0, normal: 0, emergency: 0 },
      error: {
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch complaints",
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/complaints
 * Submits a new complaint.
 * Automatically performs text-only similarity grouping.
 * When group reaches >= 5, marks the group and all its members as emergency.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = CreateComplaintRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errorResponse: CreateComplaintResponse = {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Request payload does not meet CreateComplaintRequest schema",
          details: parsed.error.format(),
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const result = await createComplaint(parsed.data);

    const response: CreateComplaintResponse = {
      success: true,
      complaint: result.complaint,
      cluster: result.cluster,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("POST /api/complaints error:", error);
    const errorResponse: CreateComplaintResponse = {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to create complaint",
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
