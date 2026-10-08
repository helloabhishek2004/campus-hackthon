import { NextResponse } from "next/server";
import { resolveServerIdentity } from "@/lib/auth/server-identity";

export async function GET() {
  const mock = process.env.AUTH_MODE === "mock" || process.env.NODE_ENV === "test";
  const identity = await resolveServerIdentity({ allowDemo: mock });
  return NextResponse.json({
    mode: mock ? "mock" : "supabase",
    authenticated: Boolean(identity),
    profile: identity?.profile ?? null,
  });
}
