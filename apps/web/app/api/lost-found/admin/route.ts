import { NextRequest, NextResponse } from "next/server";
import { listItems, listLogs } from "@/lib/lost-found/repository";
import { canAdministerLostFound, isIdentity, requireLostFoundIdentity } from "../_auth";

export async function GET(_req: NextRequest) {
  const identity = await requireLostFoundIdentity();
  if (!isIdentity(identity)) return identity;
  if (!canAdministerLostFound(identity)) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
  try {
    const [items, logs] = await Promise.all([
      listItems({ status: "all", page: 1, limit: 100 }),
      listLogs(),
    ]);
  return NextResponse.json(
    {
      success: true,
      custodyQueue: items.items.filter((item: any) => ["handover", "in_claim"].includes(item.status)),
      pendingStaffReviews: items.items.filter((item: any) => item.status === "in_claim").length,
      logs,
    },
    { status: 200 },
  );
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Admin data read failed" } }, { status: 500 });
  }
}
