import { NextRequest, NextResponse } from "next/server";
import { listLogs } from "@/lib/lost-found/repository";
import { isIdentity, requireLostFoundIdentity } from "../../_auth";

export async function GET(req: NextRequest) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    if (identity.profile?.role !== "admin" && !identity.profile?.tags?.some((tag: string) => ["HOD", "DEPARTMENT_COORDINATOR", "CAS_COORDINATOR"].includes(tag))) {
      return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
    }
    const logs = await listLogs();
    
    /* 1. Contact Reveals
    db.lost_found_contact_reveals?.forEach((r: any) => logs.push({
        id: r.id,
        type: 'contact_reveal',
        created_at: r.created_at,
        action: `Contact Info Revealed: ${r.reason}`,
        actor_id: `Authorized By: ${r.revealed_to}`,
    }));
    
    // 2. Item Events
    db.lost_found_item_events?.forEach((e: any) => {
        const item = db.lost_found_items.find((i: any) => i.id === e.item_id);
        logs.push({
            id: e.id || e.item_id + e.created_at,
            type: 'item_event',
            created_at: e.created_at,
            action: `Item ${e.event_type.toUpperCase()}: ${item ? item.title : e.item_id}`,
            actor_id: `Actor: ${e.actor_id}`,
        });
    });
    
    // 3. Claims
    db.lost_found_claims?.forEach((c: any) => {
        logs.push({
            id: c.id,
            type: 'claim',
            created_at: c.created_at,
            action: `Claim filed for match ${c.match_id}`,
            actor_id: `Claimant: ${c.claimant_id}`,
        });
    });
    
    // Optional: Just items if events table is empty
    if (!db.lost_found_item_events || db.lost_found_item_events.length === 0) {
        db.lost_found_items?.forEach((i: any) => {
            logs.push({
                id: i.id,
                type: 'item_event',
                created_at: i.created_at,
                action: `Reported ${i.type} item: ${i.title}`,
                actor_id: `Reporter: ${i.reporter_id}`,
            });
        });
    }
    
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); */

    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
