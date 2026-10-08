import { NextRequest, NextResponse } from "next/server";
import { isIdentity, publicItem, requireLostFoundIdentity } from "../../_auth";
import { getItem } from "@/lib/lost-found/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const { id } = await params;
    const result = await getItem(id);
    if (!result) {
      return NextResponse.json({ success: false, error: { message: "Item not found" } }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, item: result.public }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Lost & Found read failed" } }, { status: 500 });
  }
}
