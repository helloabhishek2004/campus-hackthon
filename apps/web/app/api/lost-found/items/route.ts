import { NextRequest, NextResponse } from "next/server";
import { CreateLostItemRequestSchema, CreateFoundItemRequestSchema } from "@smart-campus/contracts";
import { getQueue } from "@/lib/queue";
import { isIdentity, requireLostFoundIdentity } from "../_auth";
import { createItem, listItems } from "@/lib/lost-found/repository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");

  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const statusParam = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase().trim();
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const result = await listItems({ type, category, status: statusParam, q, page, limit });
    return NextResponse.json({ success: true, items: result.items, pagination: { total: result.total, page: result.page, limit: result.limit } }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lost & Found read failed";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const reporterId = identity.userId;
    const body = await req.json();
    const type = body?.type || "lost";
    const images = body?.images || []; // Array of base64 strings

    const sanitizedBody = Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== "")); const validation = type === "found" ? CreateFoundItemRequestSchema.safeParse(sanitizedBody) : CreateLostItemRequestSchema.safeParse(sanitizedBody);
    if (!validation.success) { console.error("Validation error:", validation.error.format()); 
      return NextResponse.json({ success: false, error: { message: "Validation failed" } }, { status: 400 });
    }

    const sensitiveCategories = ["id_cards_docs", "wallets_purses", "keys"];
    const isSensitive = sensitiveCategories.includes(validation.data.category);

    const result = await createItem({
        type: type as "lost" | "found",
        reporter_id: reporterId,
        category: validation.data.category,
        subcategory: validation.data.subcategory,
        title: validation.data.title,
        public_description: validation.data.public_description,
        private_description: validation.data.private_description,
        identifying_marks: validation.data.identifying_marks,
        location_id: validation.data.location_id,
        location_description: validation.data.location_description,
        event_date: validation.data.event_date,
        is_sensitive: isSensitive,
        images,
    });

    try {
        const queue = await getQueue();
        await queue.send('process-item', {
            itemId: result.row.id,
            type: result.row.type,
            title: result.row.title,
            description: result.row.private_description || result.row.public_description,
            imageUrls: images.map((i: any) => i.public_url) // passing base64 strings
        });
    } catch (error) {
        // The item is already durably recorded. Keep it in `processing` and
        // surface the processing limitation rather than falling back to JSON.
        console.error("Lost & Found processing could not be queued:", error);
    }

     return NextResponse.json({ success: true, item: result.public }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lost & Found create failed";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
