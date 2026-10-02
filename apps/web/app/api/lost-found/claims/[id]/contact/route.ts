import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@smart-campus/lost-and-found";
import { randomUUID } from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    
    const claim = db.lost_found_claims.find((c: any) => c.id === id);
    if (!claim || claim.status !== 'approved') return NextResponse.json({ success: false, error: { message: "Not authorized" } }, { status: 403 });
    
    const reporterId = "33333333-3333-3333-3333-333333330001"; 
    
    db.lost_found_contact_reveals.push({
        id: randomUUID(),
        claim_id: claim.id,
        revealed_to: reporterId,
        revealed_party_id: "other-party-id",
        reason: "Handover facilitation",
        created_at: new Date().toISOString()
    });
    writeDb(db);

    return NextResponse.json({ 
        success: true, mode: "in_person", 
        contact: {
            name: "Test User",
            phone: "+919876543210",
            email: "test@campus.edu",
            instructions: "Meet at security desk."
        }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
