import type { InstitutionalLookupResponse } from "@smart-campus/contracts";
import { createClient } from "../supabase/server";
import { findInstitutionalRecord, verifyMockSessionToken } from "./identity-service";
import { createServiceClient } from "../supabase/server";
import { cookies } from "next/headers";

export interface ServerIdentity {
  userId: string;
  institutionalId?: string;
  profile?: InstitutionalLookupResponse;
  isDemo: boolean;
}

type RequestCookieSource = {
  cookies: {
    get(name: string): { value: string } | undefined;
  };
};

/**
 * Resolve identity only from the Supabase session. Browser storage and
 * caller-supplied identity headers are deliberately not trusted here.
 *
 * Tests and the local demo may opt into the bounded mock mode. This mode is
 * enabled by AUTH_MODE=mock (or the test runner) and never applies to a
 * normal production deployment.
 */
export async function resolveServerIdentity(
  options: { allowDemo?: boolean; request?: RequestCookieSource } = {},
): Promise<ServerIdentity | null> {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder"),
  );

  try {
    if (!configured) throw new Error("Supabase is not configured");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      let institutionalId =
        typeof data.user.user_metadata?.institutional_id === "string"
          ? data.user.user_metadata.institutional_id
          : undefined;
      let record = institutionalId ? await findInstitutionalRecord(institutionalId) : null;
      // Prefer the database link keyed by auth.uid; metadata is only a
      // compatibility fallback and is never trusted for authorization alone.
      const { data: ownLink } = await supabase
        .from("institutional_users")
        .select("institutional_id")
        .eq("linked_profile_id", data.user.id)
        .maybeSingle();
      if (ownLink?.institutional_id) {
        institutionalId = ownLink.institutional_id;
        record = await findInstitutionalRecord(ownLink.institutional_id);
      }
      try {
        const admin = createServiceClient();
        const { data: linked } = await admin.from("institutional_users").select("institutional_id").eq("linked_profile_id", data.user.id).maybeSingle();
        if (linked?.institutional_id) {
          const linkedInstitutionalId = linked.institutional_id;
          institutionalId = linkedInstitutionalId;
          record = await findInstitutionalRecord(linkedInstitutionalId);
        }
      } catch {
        // Service role is optional for already-linked sessions; metadata/RPC remains a safe fallback.
      }
      return {
        userId: data.user.id,
        institutionalId: record?.profile.institutionalId || institutionalId,
        profile: record?.profile,
        isDemo: false,
      };
    }
  } catch {
    // An unavailable auth backend is unauthenticated, never a reason to trust
    // a client-provided identity.
  }

  const demoEnabled = process.env.AUTH_MODE === "mock" || process.env.NODE_ENV === "test";
  if (options.allowDemo && demoEnabled) {
    let token = options.request?.cookies.get("campusgram_mock_session")?.value;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get("campusgram_mock_session")?.value;
      } catch {
        // Unit tests can invoke route handlers without a Next request scope.
      }
    }
    const session = token ? verifyMockSessionToken(token) : null;
    // Mock mode still requires the HTTP-only session cookie. A default demo
    // identity would let an unauthenticated request impersonate the seed user.
    if (!session) return null;
    const demoRecord = await findInstitutionalRecord(session.institutionalId);
    if (!demoRecord) return null;
    return {
      userId: session.profileId || demoRecord.profile.id,
      institutionalId: demoRecord.profile.institutionalId,
      profile: demoRecord?.profile,
      isDemo: true,
    };
  }

  return null;
}
