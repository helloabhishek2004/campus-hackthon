import { NextResponse } from "next/server";
import { getDocumentTypes } from "@/lib/documents/document-service";

export async function GET() {
  try {
    const documentTypes = await getDocumentTypes();
    return NextResponse.json({
      success: true,
      count: documentTypes.length,
      documentTypes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve document types." },
      { status: 500 }
    );
  }
}
