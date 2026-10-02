import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@smart-campus/lost-and-found";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    
    const matches = db.lost_found_matches.filter((m: any) => m.lost_item_id === id || m.found_item_id === id);
    
    // Join items
    const enrichedMatches = matches.map((m: any) => {
        const otherId = m.lost_item_id === id ? m.found_item_id : m.lost_item_id;
        const matchedItem = db.lost_found_items.find((i: any) => i.id === otherId);
        return {
            ...m,
            matched_item: matchedItem ? {
                ...matchedItem,
                images: db.lost_found_item_images?.filter((img: any) => img.item_id === otherId) || []
            } : null
        };
    });

    return NextResponse.json({ success: true, matches: enrichedMatches }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
