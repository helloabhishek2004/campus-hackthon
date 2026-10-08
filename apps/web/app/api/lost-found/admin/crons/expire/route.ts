import { NextResponse } from "next/server";
import { getQueue } from "@/lib/queue";
import { canAdministerLostFound, isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function POST() {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    if (!canAdministerLostFound(identity)) {
        return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
    }
    try {
        const queue = await getQueue();
        await queue.send('expire-items', {});
        return NextResponse.json({ success: true, message: "Expire-items job queued" });
    } catch(e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
