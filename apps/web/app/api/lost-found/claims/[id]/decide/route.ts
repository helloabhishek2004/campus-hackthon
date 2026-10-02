import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@smart-campus/lost-and-found";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { decision } = await req.json();
    const db = readDb();
    
    const claim = db.lost_found_claims.find((c: any) => c.id === id);
    if (!claim) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });
    
    claim.status = decision;
    
    if (decision === 'approved') {
        const item = db.lost_found_items.find((i: any) => i.id === claim.item_id);
        if (item) item.status = "handover";
    }

    writeDb(db);
    return NextResponse.json({ success: true, claim }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
