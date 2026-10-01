import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { ComplaintAttachment } from "@smart-campus/contracts";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FILE",
            message: "No file was uploaded. Please provide an image file.",
          },
        },
        { status: 400 },
      );
    }

    const blob = file as Blob;

    // 1. Validate MIME type (Images only)
    if (!ALLOWED_MIME_TYPES.includes(blob.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FILE_TYPE",
            message: `Only image uploads are allowed (${ALLOWED_MIME_TYPES.join(", ")}). Received: ${blob.type}`,
          },
        },
        { status: 400 },
      );
    }

    // 2. Validate file size
    if (blob.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: `File exceeds maximum allowed size of 5 MB. Size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
          },
        },
        { status: 400 },
      );
    }

    // 3. Store file to public/uploads/complaints
    const buffer = Buffer.from(await blob.arrayBuffer());
    const fileExt = blob.type.split("/")[1] || "jpg";
    const fileId = crypto.randomUUID();
    const safeFilename = `${fileId}.${fileExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "complaints");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/complaints/${safeFilename}`;

    const attachment: ComplaintAttachment = {
      id: fileId,
      url: publicUrl,
      filename: (file as any).name || safeFilename,
      mime_type: blob.type,
      size_bytes: blob.size,
    };

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : "Internal server error during upload",
        },
      },
      { status: 500 },
    );
  }
}
