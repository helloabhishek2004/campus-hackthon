import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => supabaseMocks);

import { POST as verifyOtpRoute } from "../app/api/auth/otp/verify/route";
import {
  createMockSessionToken,
  findInstitutionalRecord,
  requestLoginOtp,
  verifyMockSessionToken,
} from "../lib/auth/identity-service";
import { MOCK_INSTITUTIONAL_DIRECTORY } from "../lib/auth/mock-identities";
import { resolveServerIdentity } from "../lib/auth/server-identity";

const profile = MOCK_INSTITUTIONAL_DIRECTORY[0];
const originalEnv = {
  authMode: process.env.AUTH_MODE,
  sessionSecret: process.env.AUTH_SESSION_SECRET,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  otpProvider: process.env.OTP_PROVIDER,
};

function directoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: profile.id,
    institutional_id: profile.institutionalId,
    full_name: profile.fullName,
    masked_phone: profile.maskedPhone,
    primary_role: profile.role,
    department_code: profile.departmentCode,
    department_name: profile.departmentName,
    program_code: profile.programCode,
    program_name: profile.programName,
    academic_year: profile.academicYear,
    current_semester: profile.semester,
    section: profile.section,
    designation: profile.designation,
    tags: profile.tags,
    is_active: profile.isActive,
    ...overrides,
  };
}

function queryReturning(result: unknown) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue(result);
  return query;
}

function configureDirectory(options: {
  linkedProfileId?: string | null;
  active?: boolean;
  rpcError?: Error | null;
} = {}) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";

  const linkQuery = queryReturning({
    data: {
      institutional_id: profile.institutionalId,
      linked_profile_id:
        options.linkedProfileId === undefined ? "canonical-profile" : options.linkedProfileId,
      is_active: options.active ?? true,
    },
    error: null,
  });
  const serviceClient = {
    rpc: vi.fn().mockResolvedValue({
      data: options.rpcError ? null : [directoryRow({ is_active: options.active ?? true })],
      error: options.rpcError,
    }),
    from: vi.fn().mockReturnValue(linkQuery),
  };
  supabaseMocks.createServiceClient.mockReturnValue(serviceClient);
  return { linkQuery, serviceClient };
}

function cookieRequest(value?: string) {
  return {
    cookies: {
      get: vi.fn(() => (value ? { value } : undefined)),
    },
  };
}

function tokenForPayload(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", process.env.AUTH_SESSION_SECRET!)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

describe("focused authentication hardening", () => {
  beforeEach(() => {
    process.env.AUTH_MODE = "mock";
    process.env.AUTH_SESSION_SECRET = "test-only-auth-session-secret";
    process.env.OTP_PROVIDER = "mock";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseMocks.createClient.mockReset();
    supabaseMocks.createServiceClient.mockReset();
  });

  afterEach(() => {
    const restore = (name: string, value: string | undefined) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    };
    restore("AUTH_MODE", originalEnv.authMode);
    restore("AUTH_SESSION_SECRET", originalEnv.sessionSecret);
    restore("SUPABASE_SERVICE_ROLE_KEY", originalEnv.serviceKey);
    restore("NEXT_PUBLIC_SUPABASE_URL", originalEnv.supabaseUrl);
    restore("NEXT_PUBLIC_SUPABASE_ANON_KEY", originalEnv.anonKey);
    restore("OTP_PROVIDER", originalEnv.otpProvider);
  });

  it("rejects unauthenticated, spoofed, tampered, future, expired, and malformed sessions", async () => {
    expect(await resolveServerIdentity({ allowDemo: true, request: cookieRequest() })).toBeNull();
    expect(
      await resolveServerIdentity({
        allowDemo: true,
        request: cookieRequest("not-a-session"),
      }),
    ).toBeNull();

    const valid = createMockSessionToken(profile, profile.id);
    const [payload, signature] = valid.split(".");
    const tamperedSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
    expect(
      await resolveServerIdentity({
        allowDemo: true,
        request: cookieRequest(`${payload}.${tamperedSignature}`),
      }),
    ).toBeNull();

    const now = Date.now();
    expect(
      verifyMockSessionToken(
        tokenForPayload({
          institutionalId: profile.institutionalId,
          profileId: profile.id,
           issuedAt: now + 60_000,
           expiresAt: now + 86_460_000,
        }),
      ),
    ).toBeNull();
    expect(
      verifyMockSessionToken(
        tokenForPayload({
          institutionalId: profile.institutionalId,
          profileId: profile.id,
          issuedAt: now - 86_400_000,
          expiresAt: now,
        }),
      ),
    ).toBeNull();
  });

  it("consumes the HTTP-only cookie issued by the actual OTP verify route", async () => {
    await requestLoginOtp(profile.institutionalId);
    const response = await verifyOtpRoute(
      new Request("http://localhost/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ institutionalId: profile.institutionalId, otp: "123456" }),
        headers: { "content-type": "application/json" },
      }) as never,
    );
    expect(response.status).toBe(200);

    const cookie = response.cookies.get("campusgram_mock_session");
    expect(cookie?.value).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    const identity = await resolveServerIdentity({
      allowDemo: true,
      request: cookieRequest(cookie?.value),
    });
    expect(identity?.userId).toBe(profile.id);
    expect(identity?.institutionalId).toBe(profile.institutionalId);
  });

  it("prioritizes the mock cookie and rejects a conflicting Supabase user", async () => {
    configureDirectory({ linkedProfileId: "canonical-profile" });
    supabaseMocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "supabase-user", user_metadata: { institutional_id: profile.institutionalId } } },
          error: null,
        }),
      },
    });

    const identity = await resolveServerIdentity({
      allowDemo: true,
      request: cookieRequest(createMockSessionToken(profile, "canonical-profile")),
    });
    expect(identity?.userId).toBe("canonical-profile");
    expect(identity?.isDemo).toBe(true);
    expect(supabaseMocks.createClient).not.toHaveBeenCalled();
  });

  it("requires the canonical linked profile and active directory record in configured mode", async () => {
    configureDirectory({ linkedProfileId: "canonical-profile" });
    const validToken = createMockSessionToken(profile, "different-profile");
    expect(
      await resolveServerIdentity({ allowDemo: true, request: cookieRequest(validToken) }),
    ).toBeNull();

    configureDirectory({ linkedProfileId: "canonical-profile", active: false });
    expect(
      await resolveServerIdentity({
        allowDemo: true,
        request: cookieRequest(createMockSessionToken(profile, "canonical-profile")),
      }),
    ).toBeNull();
  });

  it("does not authorize a real Supabase user from metadata without a directory link", async () => {
    configureDirectory();
    const linkQuery = queryReturning({ data: null, error: null });
    supabaseMocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue(linkQuery),
      rpc: vi.fn(),
    });
    supabaseMocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "unlinked-user", user_metadata: { institutional_id: profile.institutionalId } } },
          error: null,
        }),
      },
    });
    process.env.AUTH_MODE = "supabase";

    expect(await resolveServerIdentity()).toBeNull();
  });

  it("resolves a configured Supabase user through the active canonical link", async () => {
    configureDirectory({ linkedProfileId: "canonical-profile" });
    supabaseMocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "canonical-profile",
              user_metadata: { institutional_id: "UNTRUSTED_METADATA_ID" },
            },
          },
          error: null,
        }),
      },
    });
    process.env.AUTH_MODE = "supabase";

    const identity = await resolveServerIdentity();
    expect(identity?.userId).toBe("canonical-profile");
    expect(identity?.institutionalId).toBe(profile.institutionalId);
    expect(identity?.isDemo).toBe(false);
  });

  it("never falls back to the mock directory during a configured database outage", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.test";
    supabaseMocks.createServiceClient.mockImplementation(() => {
      throw new Error("database unavailable");
    });
    const result = await findInstitutionalRecord(profile.institutionalId);
    expect(result).toBeNull();
  });
});
