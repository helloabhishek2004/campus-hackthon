import { NextRequest, NextResponse } from "next/server";
import {
  CreateDocumentRequestSchema,
  DocumentCategorySchema,
} from "@smart-campus/contracts";
import {
  listUserDocuments,
  createDocument,
} from "@/lib/documents/document-service";
import {
  uploadDocumentToStorage,
  validateDocumentFile,
} from "@/lib/documents/document-storage";
import { resolveServerIdentity } from "@/lib/auth/server-identity";

/**
 * Resolves current user context from session header or default demo student.
 */
async function resolveUserContext(_req: NextRequest) {
  const identity = await resolveServerIdentity({ allowDemo: true });
  if (identity?.profile) {
    return {
      id: identity.userId,
      role: identity.profile.role,
      fullName: identity.profile.fullName,
      institutionalId: identity.profile.institutionalId,
      departmentCode: identity.profile.departmentCode,
      tags: identity.profile.tags,
    };
  }
  throw new Error("Unauthenticated document request");
}

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserContext(req);
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const query = searchParams.get("q") || searchParams.get("search") || undefined;

    const documents = await listUserDocuments(user.id, { category, query });

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthenticated") ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve documents." },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserContext(req);

    // Support both FormData (file upload) and JSON payload
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const documentTypeCode = formData.get("documentTypeCode")?.toString() || "";
      const title = formData.get("title")?.toString() || "";
      const description = formData.get("description")?.toString() || undefined;
      const categoryRaw = formData.get("category")?.toString() || "academic";
      const validThrough = formData.get("validThrough")?.toString() || undefined;
      const remarks = formData.get("remarks")?.toString() || undefined;
      const file = formData.get("file") as File | null;

      const categoryParsed = DocumentCategorySchema.safeParse(categoryRaw);
      if (!categoryParsed.success) {
        return NextResponse.json(
          { error: "Invalid category. Must be 'academic' or 'non-academic'." },
          { status: 400 }
        );
      }

      const requestPayload = {
        documentTypeCode,
        title,
        description,
        category: categoryParsed.data,
        validThrough,
        remarks,
        originalFilename: file ? file.name : undefined,
        mimeType: file ? file.type : undefined,
        fileSize: file ? file.size : undefined,
      };

      const parsedRequest = CreateDocumentRequestSchema.safeParse(requestPayload);
      if (!parsedRequest.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsedRequest.error.issues },
          { status: 400 }
        );
      }

      let storageInfo: any = undefined;

      if (file && file.size > 0) {
        const validation = validateDocumentFile(file.type, file.size);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const uploadResult = await uploadDocumentToStorage({
          ownerId: user.id,
          documentId: `doc-${Date.now()}`,
          version: 1,
          fileName: file.name,
          fileBuffer: buffer,
          mimeType: file.type,
        });

        storageInfo = {
          storagePath: uploadResult.storagePath,
          originalFilename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        };
      }

      const createdDoc = await createDocument(user, parsedRequest.data, storageInfo);

      return NextResponse.json({
        success: true,
        document: createdDoc,
        message: "Document registered successfully.",
      });
    }

    // JSON upload
    const body = await req.json();
    const parsedRequest = CreateDocumentRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsedRequest.error.issues },
        { status: 400 }
      );
    }

    const createdDoc = await createDocument(user, parsedRequest.data);

    return NextResponse.json({
      success: true,
      document: createdDoc,
      message: "Document registered successfully.",
    });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthenticated") ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to create document." },
      { status }
    );
  }
}
