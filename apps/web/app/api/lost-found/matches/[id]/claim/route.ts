import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@smart-campus/lost-and-found";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    
    const match = db.lost_found_matches.find((m: any) => m.id === id);
    if (!match) return NextResponse.json({ success: false, error: { message: "Match not found" } }, { status: 404 });
    
    const reporterId = "33333333-3333-3333-3333-333333330001"; 
    const claim = {
        id: randomUUID(),
        item_id: match.found_item_id,
        claimant_id: reporterId,
        match_id: match.id,
        status: "pending",
        handover_mode: "campus_security",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    db.lost_found_claims.push(claim);
    
    // update items to in_claim
    const lostItem = db.lost_found_items.find((i: any) => i.id === match.lost_item_id);
    const foundItem = db.lost_found_items.find((i: any) => i.id === match.found_item_id);
    if (lostItem) lostItem.status = "in_claim";
    if (foundItem) foundItem.status = "in_claim";
    
    writeDb(db);

    return NextResponse.json({ success: true, claim }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
