import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@smart-campus/lost-and-found";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    
    const item = db.lost_found_items.find((i: any) => i.id === id);
    if (!item) {
      return NextResponse.json({ success: false, error: { message: "Item not found" } }, { status: 404 });
    }
    
    item.images = db.lost_found_item_images?.filter((img: any) => img.item_id === id) || [];
    
    const reporterId = "33333333-3333-3333-3333-333333330001"; 
    const isAdmin = false; 

    if (item.reporter_id !== reporterId && !isAdmin) {
      delete item.private_description;
      delete item.identifying_marks;
    }

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
