import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@smart-campus/lost-and-found";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    
    const claim = db.lost_found_claims.find((c: any) => c.id === id);
    if (!claim) return NextResponse.json({ success: false, error: { message: "Claim not found" } }, { status: 404 });
    
    const item = db.lost_found_items.find((i: any) => i.id === claim.item_id);

    return NextResponse.json({ 
        success: true, 
        claim: {
            ...claim,
            item
        }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
