import {
  InstitutionalLookupResponse,
  InstitutionalLookupResponseSchema,
  RequestOtpResponse,
  VerifyOtpResponse,
} from "@smart-campus/contracts";
import { createClient } from "../supabase/server";
import { MOCK_INSTITUTIONAL_DIRECTORY, MockInstitutionalRecord } from "./mock-identities";
import { generateAndSendOtp, verifyOtpChallenge } from "./otp";
import { maskPhoneNumber } from "./masking";

/**
 * Institutional Identity Service
 *
 * Provides safe lookups and OTP authentication challenges without ever
 * exposing raw phone numbers to unauthenticated clients.
 */

export async function findInstitutionalRecord(
  institutionalId: string
): Promise<{ profile: InstitutionalLookupResponse; rawPhone?: string } | null> {
  const normId = institutionalId.trim().toUpperCase();

  // 1. Try Supabase lookup if configured
  try {
    const supabase = await createClient();
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
          rawPhone: row.phone, // Internal only, never sent to client
        };
      }
    }
  } catch (_err) {
    // Supabase not reachable or offline; fall back to deterministic mock directory
  }

  // 2. Mock directory lookup fallback
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

  const otpResult = await generateAndSendOtp(
    record.profile.institutionalId,
    record.rawPhone || ""
  );

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

  // Generate simulated session token for subsequent authenticated requests
  const simulatedToken = `inst_sess_${Buffer.from(
    `${record.profile.id}:${Date.now()}:${record.profile.institutionalId}`
  ).toString("base64")}`;

  return {
    success: true,
    message: "Identity verified successfully.",
    profile: record.profile,
    sessionToken: simulatedToken,
  };
}
