import { NextRequest, NextResponse } from "next/server";
import { CreateLostItemRequestSchema, CreateFoundItemRequestSchema } from "@smart-campus/contracts";
import { getQueue } from "@/lib/queue";
import { readDb, writeDb } from "@smart-campus/lost-and-found";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");

  try {
    const db = readDb();
    let items = db.lost_found_items.filter((i: any) => i.status === "open");

    if (type && (type === "lost" || type === "found")) {
      items = items.filter((i: any) => i.type === type);
    }
    if (category) {
      items = items.filter((i: any) => i.category === category);
    }

    items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Attach images
    items = items.map((i: any) => ({
        ...i,
        images: db.lost_found_item_images?.filter((img: any) => img.item_id === i.id) || []
    }));

    return NextResponse.json({ success: true, items, pagination: { total: items.length } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reporterId = "33333333-3333-3333-3333-333333330001"; 
    const body = await req.json();
    const type = body?.type || "lost";
    const images = body?.images || []; // Array of base64 strings

    const sanitizedBody = Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== "")); const validation = type === "found" ? CreateFoundItemRequestSchema.safeParse(sanitizedBody) : CreateLostItemRequestSchema.safeParse(sanitizedBody);
    if (!validation.success) { console.error("Validation error:", validation.error.format()); 
      return NextResponse.json({ success: false, error: { message: "Validation failed" } }, { status: 400 });
    }

    const sensitiveCategories = ["id_cards_docs", "wallets_purses", "keys"];
    const isSensitive = sensitiveCategories.includes(validation.data.category);

    const db = readDb();
    const newItemId = randomUUID();
    const newItem = {
        id: newItemId,
        type,
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
        status: "processing",
        is_sensitive: isSensitive,
        created_at: new Date().toISOString()
    };

    db.lost_found_items.push(newItem);
    
    // Save images to local DB
    if (!db.lost_found_item_images) db.lost_found_item_images = [];
    images.forEach((imgObj: any, index: number) => {
        db.lost_found_item_images.push({
            id: randomUUID(),
            item_id: newItemId,
            public_url: imgObj.public_url,
            is_primary: index === 0,
            created_at: new Date().toISOString()
        });
    });

    db.lost_found_item_events.push({
        item_id: newItemId,
        event_type: "created",
        actor_id: reporterId,
        created_at: new Date().toISOString()
    });
    
    writeDb(db);

    try {
        const queue = await getQueue();
        await queue.send('process-item', {
            itemId: newItemId,
            type: newItem.type,
            title: newItem.title,
            description: newItem.private_description || newItem.public_description,
            imageUrls: images.map((i: any) => i.public_url) // passing base64 strings
        });
    } catch(e) {}

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
