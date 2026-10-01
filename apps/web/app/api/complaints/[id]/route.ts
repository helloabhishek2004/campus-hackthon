import { NextRequest, NextResponse } from "next/server";
import { getComplaints } from "../../../../lib/complaints/complaint-repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { complaints } = await getComplaints("all");

    const complaint = complaints.find((c) => c.id === id);
    if (!complaint) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Complaint with ID ${id} not found`,
          },
        },
        { status: 404 },
      );
    }

    const peerComplaints = complaints.filter(
      (c) => c.cluster_id === complaint.cluster_id && c.id !== complaint.id,
    );

    return NextResponse.json(
      {
        success: true,
        complaint,
        peer_complaints: peerComplaints,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error instanceof Error ? error.message : "Internal error",
        },
      },
      { status: 500 },
    );
  }
}
