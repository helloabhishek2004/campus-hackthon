import { NextRequest, NextResponse } from "next/server";
import { getClaim, revealContact } from "@/lib/lost-found/repository";
import { canReleaseContactInfo } from "@smart-campus/lost-and-found";
import { isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const { id } = await params;
     const loaded = await getClaim(id); const claim = loaded?.claim as any;
     if (!claim) return NextResponse.json({ success: false, error: { message: "Claim not found" } }, { status: 404 });
     const expiry = claim.contact_window_expires_at ? new Date(claim.contact_window_expires_at) : null;
     const authorization = canReleaseContactInfo({ userId: identity.userId, role: identity.profile?.role === "admin" ? "admin" : "student" }, claim, expiry);
     if (!authorization.isAuthorized) return NextResponse.json({ success: false, error: { message: authorization.reason } }, { status: 403 });
    
     await revealContact(id, identity.userId);

    return NextResponse.json({ 
        success: true, mode: "in_person", 
         contact: null,
         instructions: "Contact access is authorized, but this demo does not supply direct contact details. Campus Security coordinates the handover."
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
