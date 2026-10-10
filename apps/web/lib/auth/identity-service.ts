import {
  InstitutionalLookupResponse,
  InstitutionalLookupResponseSchema,
  RequestOtpResponse,
  VerifyOtpResponse,
} from "@smart-campus/contracts";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "../supabase/server";
import { MOCK_INSTITUTIONAL_DIRECTORY } from "./mock-identities";
import { generateAndSendOtp, verifyOtpChallenge } from "./otp";
import { maskPhoneNumber } from "./masking";

/**
 * Institutional Identity Service
 *
 * Provides safe lookups and deterministic OTP authentication challenges
 * without ever exposing raw phone numbers to unauthenticated clients.
 * Supabase remains the identity directory; the OTP implementation is still
 * the existing replaceable mock until an external provider is requested.
 */

export async function findInstitutionalRecord(
  institutionalId: string
): Promise<{ profile: InstitutionalLookupResponse; rawPhone?: string } | null> {
  const normId = institutionalId.trim().toUpperCase();

  // 1. Try Supabase lookup if configured
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("lookup_institutional_identity", {
      p_institutional_id: normId,
    });

    if (!error && data && data.length > 0) {
      const row = data[0];
      const parsed = InstitutionalLookupResponseSchema.safeParse({
        id: row.id,
        institutionalId: row.institutional_id,
        fullName: row.full_name,
        maskedPhone: row.masked_phone || maskPhoneNumber(row.phone),
        role: row.primary_role,
        departmentCode: row.department_code,
        departmentName: row.department_name,
        programCode: row.program_code,
        programName: row.program_name,
        academicYear: row.academic_year,
        semester: row.current_semester,
        section: row.section,
        designation: row.designation,
        tags: row.tags || [],
        isActive: row.is_active,
      });

      if (parsed.success) {
        return {
          profile: parsed.data,
        };
      }
    }
  } catch (_err) {
    // Supabase not reachable or offline; fall back to deterministic mock directory
  }

  // 2. Deterministic directory fallback is explicitly test/offline-only. A
  // configured database outage must not silently turn into a mock identity.
  const mockMode = process.env.AUTH_MODE === "mock" || process.env.NODE_ENV === "test";
  const hasServerDatabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder"),
  );
  if (!mockMode || hasServerDatabase) return null;

  const mockMatch = MOCK_INSTITUTIONAL_DIRECTORY.find(
    (u) => u.institutionalId.toUpperCase() === normId
  );

  if (mockMatch) {
    const { rawPhone, email: _email, ...profileOnly } = mockMatch;
    return {
      profile: profileOnly,
      rawPhone,
    };
  }

  return null;
}

/**
 * Look up institutional identity (safe for client consumption).
 */
export async function lookupInstitutionalIdentity(
  institutionalId: string
): Promise<InstitutionalLookupResponse | null> {
  const record = await findInstitutionalRecord(institutionalId);
  return record ? record.profile : null;
}

/**
 * Initiate OTP authentication for an institutional ID.
 */
export async function requestLoginOtp(
  institutionalId: string
): Promise<RequestOtpResponse> {
  const record = await findInstitutionalRecord(institutionalId);

  if (!record) {
    throw new Error(`Institutional ID '${institutionalId}' not found.`);
  }

  if (!record.profile.isActive) {
    throw new Error("This institutional account is inactive. Please contact administration.");
  }

  // OTP remains deterministic for the hackathon. Hosted deployments persist
  // the challenge in Supabase; tests/offline mode use the in-memory store.
  // No external SMS/Auth provider is contacted.
  const otpResult = await generateAndSendOtp(record.profile.institutionalId, "");

  return {
    success: true,
    message: otpResult.message,
    institutionalId: record.profile.institutionalId,
    maskedPhone: record.profile.maskedPhone,
    expiresInSeconds: otpResult.expiresInSeconds,
    mockOtp: otpResult.mockOtp,
  };
}

/**
 * Verify OTP and return profile.
 */
export async function verifyLoginOtp(
  institutionalId: string,
  otp: string
): Promise<VerifyOtpResponse> {
  const record = await findInstitutionalRecord(institutionalId);

  if (!record) {
    return {
      success: false,
      message: `Institutional record not found for '${institutionalId}'.`,
    };
  }

  if (!record.profile.isActive) {
    return {
      success: false,
      message: "Account is inactive. Please contact your department administration.",
    };
  }

  const verification = await verifyOtpChallenge(record.profile.institutionalId, otp);

  if (!verification.valid) {
    return {
      success: false,
      message: verification.error || "Invalid OTP entered.",
    };
  }

  const applicationProfileId = await ensureApplicationProfile(record.profile);

  return {
    success: true,
    message: "Identity verified successfully.",
    profile: record.profile,
    sessionToken: createMockSessionToken(record.profile, applicationProfileId),
  };
}

function applicationRole(role: InstitutionalLookupResponse["role"], tags: string[]) {
  if (role === "admin") return "admin" as const;
  if (tags.includes("HOD")) return "department_head" as const;
  if (role === "faculty") return "faculty" as const;
  if (role === "staff") return "maintenance_officer" as const;
  return "student" as const;
}

/**
 * Dummy OTP does not create a Supabase Auth session, but application tables
 * still reference public.profiles. Provision the matching service-side
 * profile once so the mock session can use the same canonical profile ID as
 * feed, complaints, Lost & Found, and Emergency persistence.
 */
async function ensureApplicationProfile(profile: InstitutionalLookupResponse): Promise<string> {
  if (process.env.NODE_ENV === "test") return profile.id;

  const hasServerDatabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder"),
  );
  if (process.env.AUTH_MODE === "mock" && !hasServerDatabase) return profile.id;

  const admin = createServiceClient();
  const { data: directory, error: directoryError } = await admin
    .from("institutional_users")
    .select("id,email,full_name,primary_role,linked_profile_id")
    .eq("institutional_id", profile.institutionalId)
    .maybeSingle();
  if (directoryError || !directory) {
    throw new Error(`Unable to provision the institutional application profile: ${directoryError?.message || "directory record not found"}`);
  }
  if (directory.linked_profile_id) return directory.linked_profile_id;

  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(`Unable to inspect application auth users: ${usersError.message}`);
  let authUser = users.users.find((user) => user.email?.toLowerCase() === directory.email.toLowerCase());
  if (!authUser) {
    const created = await admin.auth.admin.createUser({
      email: directory.email,
      email_confirm: true,
      user_metadata: { institutional_id: profile.institutionalId },
    });
    if (created.error || !created.data.user) throw new Error(`Unable to provision application auth user: ${created.error?.message || "no user returned"}`);
    authUser = created.data.user;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authUser.id,
    email: directory.email,
    full_name: directory.full_name,
    role: applicationRole(profile.role, profile.tags),
    department: profile.departmentCode || null,
    student_id: profile.institutionalId,
  });
  if (profileError) throw new Error(`Unable to persist application profile: ${profileError.message}`);

  const { error: linkError } = await admin
    .from("institutional_users")
    .update({ linked_profile_id: authUser.id })
    .eq("id", directory.id);
  if (linkError) throw new Error(`Unable to link institutional profile: ${linkError.message}`);
  return authUser.id;
}

const mockSessionSecret = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "campusgram-mock-session-key";

/**
 * Signs the intentionally mock application session. This is not a Supabase
 * Auth token; it only lets server routes resolve the identity selected by the
 * dummy OTP flow without trusting localStorage or request-body IDs.
 */
export function createMockSessionToken(profile: InstitutionalLookupResponse, profileId?: string): string {
  const payload = Buffer.from(JSON.stringify({
    institutionalId: profile.institutionalId,
    profileId,
    issuedAt: Date.now(),
  })).toString("base64url");
  const signature = createHmac("sha256", mockSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyMockSessionToken(token: string): { institutionalId: string; profileId?: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", mockSessionSecret()).update(payload).digest("base64url");
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.institutionalId !== "string" || typeof parsed.issuedAt !== "number") return null;
    if (Date.now() - parsed.issuedAt > 24 * 60 * 60 * 1000) return null;
    return { institutionalId: parsed.institutionalId, profileId: typeof parsed.profileId === "string" ? parsed.profileId : undefined };
  } catch {
    return null;
  }
}
