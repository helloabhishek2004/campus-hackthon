import { NextRequest, NextResponse } from "next/server";
import {
  CreateCampusPostRequestSchema,
  CampusPostCategorySchema,
  CampusPostAudienceScopeSchema,
} from "@smart-campus/contracts";
import {
  getFeedPosts,
  createCampusPost,
} from "@/lib/campus-posts/campus-post-service";
import { resolveUserContextFromRequest } from "@/lib/campus-posts/campus-post-auth";
import {
  uploadDocumentToStorage,
  validateDocumentFile,
} from "@/lib/documents/document-storage";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const query =
      searchParams.get("q") ||
      searchParams.get("query") ||
      searchParams.get("search") ||
      undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

    const feedResult = await getFeedPosts(user, {
      category,
      query,
      cursor,
      limit,
    });

    return NextResponse.json({
      success: true,
      items: feedResult.items,
      posts: feedResult.items, // Backwards-compatible
      nextCursor: feedResult.nextCursor,
      hasMore: feedResult.hasMore,
      count: feedResult.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve campus posts." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserContextFromRequest(req);
    const contentType = req.headers.get("content-type") || "";

    let requestData: any = {};
    const attachments: Array<{
      storagePath: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = formData.get("title")?.toString() || "";
      const content = formData.get("content")?.toString() || "";
      const categoryRaw = formData.get("category")?.toString() || "non-academic";
      const audienceScopeRaw = formData.get("audienceScope")?.toString() || "students";
      const departmentCode = formData.get("departmentCode")?.toString() || undefined;
      const programCode = formData.get("programCode")?.toString() || undefined;
      const academicYear = formData.get("academicYear")
        ? Number(formData.get("academicYear"))
        : undefined;
      const semester = formData.get("semester")
        ? Number(formData.get("semester"))
        : undefined;
      const section = formData.get("section")?.toString() || undefined;

      const category = CampusPostCategorySchema.safeParse(categoryRaw);
      const audienceScope = CampusPostAudienceScopeSchema.safeParse(audienceScopeRaw);

      if (!category.success || !audienceScope.success) {
        return NextResponse.json(
          { error: "Invalid category or audience scope." },
          { status: 400 }
        );
      }

      requestData = {
        title,
        content,
        category: category.data,
        audienceScope: audienceScope.data,
        departmentCode,
        programCode,
        academicYear,
        semester,
        section,
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
          documentId: `post-att-${Date.now()}`,
          version: 1,
          fileName: file.name,
          fileBuffer: buffer,
          mimeType: file.type,
        });

        attachments.push({
          storagePath: uploadResult.storagePath,
          originalFilename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      }
    } else {
      requestData = await req.json();
    }

    const parsedRequest = CreateCampusPostRequestSchema.safeParse(requestData);
    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsedRequest.error.issues },
        { status: 400 }
      );
    }

    const post = await createCampusPost(user, parsedRequest.data, attachments);

    return NextResponse.json({
      success: true,
      post,
      message: "Post published successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to publish post." },
      { status: 400 }
    );
  }
}
