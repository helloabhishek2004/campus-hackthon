import { NextRequest, NextResponse } from "next/server";
import {
  CreateLostItemRequestSchema,
  CreateFoundItemRequestSchema,
} from "@smart-campus/contracts";

export async function GET(_req: NextRequest) {
  // Boundary: List open items with pagination & filters
  return NextResponse.json(
    {
      success: true,
      message: "Lost & Found items listing boundary established",
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type || "lost";

    // Validate payload shape against shared Zod contract
    const validation =
      type === "found"
        ? CreateFoundItemRequestSchema.safeParse(body)
        : CreateLostItemRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Payload failed contract validation",
            details: validation.error.format(),
          },
        },
        { status: 400 },
      );
    }

    // Boundary established: Item persistence and background worker job queuing to be implemented by Developer C
    return NextResponse.json(
      {
        success: true,
        message:
          "Item creation boundary established. Ready for database persistence.",
        item: {
          id: `item-${Date.now()}`,
          ...validation.data,
          status: "processing",
        },
      },
      { status: 201 },
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
