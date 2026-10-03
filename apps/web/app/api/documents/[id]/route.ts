import { NextRequest, NextResponse } from "next/server";
import { getDocumentById, logDocumentEvent } from "@/lib/documents/document-service";
import { canViewDocument } from "@/lib/documents/document-permissions";
import { findInstitutionalRecord } from "@/lib/auth/identity-service";

async function resolveUserContext(req: NextRequest) {
  const userIdHeader = req.headers.get("x-campus-user-id") || "STU2026001";
  const record = await findInstitutionalRecord(userIdHeader);

  if (record) {
    return {
      userId: record.profile.id,
      role: record.profile.role,
      fullName: record.profile.fullName,
      departmentCode: record.profile.departmentCode,
      tags: record.profile.tags,
    };
  }

  return {
    userId: "33333333-3333-3333-3333-333333330001",
    role: "student" as const,
    fullName: "Aarav Sharma",
    departmentCode: "CSE",
    tags: ["CAS_COORDINATOR"],
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc) {
      return NextResponse.json(
        { error: `Document with ID '${id}' not found.` },
        { status: 404 }
      );
    }

    const user = await resolveUserContext(req);

    if (
      !canViewDocument(user, {
        ownerProfileId: doc.ownerProfileId,
        ownerInstitutionalUserId: doc.ownerProfileId,
      })
    ) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this document." },
        { status: 403 }
      );
    }

    await logDocumentEvent(doc.id, user.userId, "viewed");

    return NextResponse.json({
      success: true,
      document: doc,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve document details." },
      { status: 500 }
    );
  }
}
