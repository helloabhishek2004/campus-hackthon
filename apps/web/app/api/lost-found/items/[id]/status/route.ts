import { NextRequest, NextResponse } from "next/server";
import { LostFoundItemStatusSchema } from "@smart-campus/contracts";
import { getItem, updateItemStatus } from "@/lib/lost-found/repository";
import { canOperate, isIdentity, requireLostFoundIdentity } from "../../../_auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const identity = await requireLostFoundIdentity();
    if (!isIdentity(identity)) return identity;
    const body = await req.json();
    const nextStatus = LostFoundItemStatusSchema.safeParse(body?.status);

    if (!nextStatus.success) {
      return NextResponse.json(
        { success: false, error: "Invalid item status value" },
        { status: 400 },
      );
    }

    const item = await getItem(id);
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    if (!canOperate(identity, item.row)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const previousStatus = item.row.status;
    const updated = await updateItemStatus(id, identity.userId, nextStatus.data);
    return NextResponse.json({ success: true, message: "Item status updated.", previousStatus, status: (updated as any).status }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status = message.includes("Illegal state transition") || message.includes("changed concurrently") ? 409 : 500;
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
