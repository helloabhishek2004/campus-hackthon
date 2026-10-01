/**
 * OTP Service for Institutional Identity Authentication
 *
 * Supports mock mode (`OTP_PROVIDER=mock`) for zero-dependency local development
 * and CI/CD pipelines, with fallback/master verification codes for automated testing.
 */

export interface OtpChallenge {
  institutionalId: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory challenge store for active sessions
const activeChallenges = new Map<string, OtpChallenge>();

const DEFAULT_EXPIRATION_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 5;

export const OTP_PROVIDER = process.env.OTP_PROVIDER || "mock";

/**
 * Generate and dispatch an OTP challenge for an institutional user.
 */
export async function generateAndSendOtp(
  institutionalId: string,
  _rawPhone: string
): Promise<{ success: boolean; message: string; expiresInSeconds: number; mockOtp?: string }> {
  const normId = institutionalId.trim().toUpperCase();

  // Deterministic code in mock mode is "123456"
  const code = OTP_PROVIDER === "mock" ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();

  const challenge: OtpChallenge = {
    institutionalId: normId,
    code,
    expiresAt: Date.now() + DEFAULT_EXPIRATION_SECONDS * 1000,
    attempts: 0,
  };

  activeChallenges.set(normId, challenge);

  if (OTP_PROVIDER === "mock") {
    return {
      success: true,
      message: "Simulated OTP sent successfully to registered phone number.",
      expiresInSeconds: DEFAULT_EXPIRATION_SECONDS,
      mockOtp: code,
    };
  }

  // Live provider integration placeholder (e.g. Twilio, MSG91, Fast2SMS)
  return {
    success: true,
    message: "OTP sent to your registered phone number.",
    expiresInSeconds: DEFAULT_EXPIRATION_SECONDS,
  };
}

/**
 * Verify an entered OTP challenge.
 */
export async function verifyOtpChallenge(
  institutionalId: string,
  enteredOtp: string
): Promise<{ valid: boolean; error?: string }> {
  const normId = institutionalId.trim().toUpperCase();
  const trimmedOtp = enteredOtp.trim();

  // Master mock test bypass in mock mode
  if (OTP_PROVIDER === "mock" && trimmedOtp === "123456") {
    activeChallenges.delete(normId);
    return { valid: true };
  }

  const challenge = activeChallenges.get(normId);
  if (!challenge) {
    // If no active challenge in mock mode and otp matches 123456, accept
    if (OTP_PROVIDER === "mock" && trimmedOtp === "123456") {
      return { valid: true };
    }
    return {
      valid: false,
      error: "No active OTP challenge found or challenge expired. Please request a new OTP.",
    };
  }

  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(normId);
    return {
      valid: false,
      error: "OTP has expired. Please request a new OTP.",
    };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    activeChallenges.delete(normId);
    return {
      valid: false,
      error: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  if (challenge.code !== trimmedOtp) {
    challenge.attempts += 1;
    return {
      valid: false,
      error: `Invalid OTP. ${MAX_ATTEMPTS - challenge.attempts} attempt(s) remaining.`,
    };
  }

  // Challenge valid, clean up
  activeChallenges.delete(normId);
  return { valid: true };
}

/**
 * Helper to clear challenges (useful in testing)
 */
export function resetOtpChallenges(): void {
  activeChallenges.clear();
}
