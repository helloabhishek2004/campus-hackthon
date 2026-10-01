import { NextRequest, NextResponse } from "next/server";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import { facultyAcademicService } from "@/lib/faculty/faculty-academic-service";
import {
  CreateAcademicDocumentRequestSchema,
  AcademicDocumentTypeSchema,
  AcademicTargetScopeSchema,
  AcademicDocumentPrioritySchema,
  FacultyDocumentQuerySchema,
} from "@smart-campus/contracts";
import {
  uploadDocumentToStorage,
  validateDocumentFile,
} from "@/lib/documents/document-storage";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const tab = searchParams.get("tab") === "sent" ? "sent" : "received";
    const filter = searchParams.get("filter") || undefined;
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

    const query = FacultyDocumentQuerySchema.parse({
      tab,
      filter: filter ?? undefined,
      search: search ?? undefined,
      cursor: cursor ?? undefined,
      limit: limit ?? undefined,
    });

    if (query.tab === "sent") {
      const response = await facultyAcademicService.getSentDocuments(user, query);
      return NextResponse.json(response);
    } else {
      const response = await facultyAcademicService.getReceivedDocuments(user, query);
      return NextResponse.json(response);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve academic documents." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const contentType = req.headers.get("content-type") || "";

    let requestData: any = {};
    let attachment:
      | {
          storagePath: string;
          originalFilename: string;
          mimeType: string;
          fileSize: number;
        }
      | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = formData.get("title")?.toString() || "";
      const content = formData.get("content")?.toString() || "";
      const documentTypeRaw = formData.get("documentType")?.toString() || "";
      const priorityRaw = formData.get("priority")?.toString() || "normal";
      const deadline = formData.get("deadline")?.toString() || undefined;
      const targetScopeRaw = formData.get("targetScope")?.toString() || "";
      const targetDepartmentCode =
        formData.get("targetDepartmentCode")?.toString() || undefined;
      const targetProgramCode =
        formData.get("targetProgramCode")?.toString() || undefined;
      const targetAcademicYear = formData.get("targetAcademicYear")
        ? Number(formData.get("targetAcademicYear"))
        : undefined;
      const targetSemester = formData.get("targetSemester")
        ? Number(formData.get("targetSemester"))
        : undefined;
      const targetSection =
        formData.get("targetSection")?.toString() || undefined;
      const targetCourseId =
        formData.get("targetCourseId")?.toString() || undefined;
      const targetCourseName =
        formData.get("targetCourseName")?.toString() || undefined;

      const docTypeParsed = AcademicDocumentTypeSchema.safeParse(documentTypeRaw);
      const targetScopeParsed = AcademicTargetScopeSchema.safeParse(targetScopeRaw);
      const priorityParsed = AcademicDocumentPrioritySchema.safeParse(priorityRaw);

      if (!docTypeParsed.success || !targetScopeParsed.success) {
        return NextResponse.json(
          { error: "Invalid document type or target scope." },
          { status: 400 }
        );
      }

      requestData = {
        title,
        content,
        documentType: docTypeParsed.data,
        priority: priorityParsed.success ? priorityParsed.data : "normal",
        deadline,
        targetScope: targetScopeParsed.data,
        targetDepartmentCode,
        targetProgramCode,
        targetAcademicYear,
        targetSemester,
        targetSection,
        targetCourseId,
        targetCourseName,
      };

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        const validation = validateDocumentFile(file.type, file.size);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const uploadResult = await uploadDocumentToStorage({
          ownerId: user.id,
          documentId: `acad-att-${Date.now()}`,
          version: 1,
          fileName: file.name,
          mimeType: file.type,
          fileBuffer: Buffer.from(buffer),
        });

        if (uploadResult && uploadResult.storagePath) {
          attachment = {
            storagePath: uploadResult.storagePath,
            originalFilename: file.name,
            mimeType: file.type,
            fileSize: file.size,
          };
        }
      }
    } else {
      requestData = await req.json();
    }

    const validated = CreateAcademicDocumentRequestSchema.safeParse(requestData);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const document = await facultyAcademicService.createDocument(
      user,
      validated.data,
      attachment
    );

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to create academic document." },
      { status }
    );
  }
}
