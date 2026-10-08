import { NextRequest, NextResponse } from "next/server";
import { getDocumentById, logDocumentEvent } from "@/lib/documents/document-service";
import { canViewDocument } from "@/lib/documents/document-permissions";
import { resolveServerIdentity } from "@/lib/auth/server-identity";

async function resolveUserContext(_req: NextRequest) {
  const identity = await resolveServerIdentity({ allowDemo: true });
  if (identity?.profile) {
    return {
      userId: identity.userId,
      role: identity.profile.role,
      fullName: identity.profile.fullName,
      departmentCode: identity.profile.departmentCode,
      tags: identity.profile.tags,
    };
  }
  throw new Error("Unauthenticated document request");
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
    const status = error?.message?.includes("Unauthenticated") ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve document details." },
      { status }
    );
  }
}
