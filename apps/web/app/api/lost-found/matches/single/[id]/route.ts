import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@smart-campus/lost-and-found";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    
    const match = db.lost_found_matches.find((m: any) => m.id === id);
    if (!match) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });
    
    const lostItem = db.lost_found_items.find((i: any) => i.id === match.lost_item_id);
    const foundItem = db.lost_found_items.find((i: any) => i.id === match.found_item_id);

    return NextResponse.json({ 
        success: true, 
        match: {
            ...match,
            lost_item: lostItem,
            found_item: foundItem
        } 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
