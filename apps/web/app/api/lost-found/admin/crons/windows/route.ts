import { NextResponse } from "next/server";
import { getQueue } from "@/lib/queue";

export async function POST() {
    try {
        const queue = await getQueue();
        await queue.send('close-contact-windows', {});
        return NextResponse.json({ success: true, message: "Close-contact-windows job queued" });
    } catch(e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
