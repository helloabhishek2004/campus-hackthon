import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentById,
  logDocumentEvent,
} from "@/lib/documents/document-service";
import { createDocumentSignedUrl } from "@/lib/documents/document-storage";
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
        { error: "Forbidden: You are not authorized to access this document." },
        { status: 403 }
      );
    }

    // Generate signed download URL
    const storagePath = doc.storagePath || `documents/certified/${doc.documentNumber}.pdf`;
    const signed = await createDocumentSignedUrl(storagePath, 300);

    // Audit log event
    await logDocumentEvent(doc.id, user.userId, "downloaded", {
      documentNumber: doc.documentNumber,
      isMock: signed.isMock,
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      title: doc.title,
      downloadUrl: signed.signedUrl,
      fileName: `${doc.documentNumber}.pdf`,
      mimeType: doc.mimeType || "application/pdf",
      expiresInSeconds: signed.expiresInSeconds,
      isMock: signed.isMock,
    });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthenticated") ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to generate download URL." },
      { status }
    );
  }
}
