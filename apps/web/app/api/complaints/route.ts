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
import { resolveServerIdentity } from "../../../lib/auth/server-identity";

/**
 * GET /api/complaints
 * Returns list of complaints filtered by view (all | normal | emergency).
 * Each complaint reflects its group count and real-time emergency classification.
 */
export async function GET(req: NextRequest) {
  try {
    const identity = await resolveServerIdentity({ allowDemo: true, request: req });
    if (!identity) {
      return NextResponse.json(
        { success: false, complaints: [], counts: { total: 0, normal: 0, emergency: 0 }, error: { code: "UNAUTHENTICATED", message: "Sign in with your institutional account to view complaints." } },
        { status: 401 },
      );
    }
    const { searchParams } = new URL(req.url);
    const viewParam = searchParams.get("view") || "all";

    const parsedQuery = ComplaintListQuerySchema.safeParse({ view: viewParam });
    const view = parsedQuery.success ? parsedQuery.data.view : "all";

    const canViewAll = Boolean(
      identity.profile &&
        (["admin", "faculty", "staff"].includes(identity.profile.role) ||
          identity.profile.tags.some((tag) => ["HOD", "DEPARTMENT_COORDINATOR"].includes(tag))),
    );
    const { complaints, counts } = await getComplaints(view, {
      userId: identity.userId,
      canViewAll,
    });

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
    const identity = await resolveServerIdentity({ allowDemo: true, request: req });
    if (!identity) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in with your institutional account to submit a complaint." } },
        { status: 401 },
      );
    }
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

    // Ownership always comes from the resolved server identity. Ignore any
    // complainant_id supplied by the browser.
    const result = await createComplaint({
      ...parsed.data,
      complainant_id: identity.userId,
    });

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
        code: error instanceof Error && error.message.startsWith("Complaint persistence failed")
          ? "PERSISTENCE_FAILED"
          : "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to create complaint",
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
