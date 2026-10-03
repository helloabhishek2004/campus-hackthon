import { InstitutionalLookupResponse } from "@smart-campus/contracts";
import { MOCK_INSTITUTIONAL_DIRECTORY } from "../auth/mock-identities";

/**
 * Interface for looking up institutional identity.
 * Allows seamless switching between mock directory and real backend services.
 */
export interface IdentityLookupService {
  lookupByInstitutionalId(id: string): Promise<InstitutionalLookupResponse | null>;
}

/**
 * Mock implementation of IdentityLookupService.
 * Safe for client-side and server-side execution without coupling to server-only headers.
 */
export class MockIdentityLookupService implements IdentityLookupService {
  async lookupByInstitutionalId(id: string): Promise<InstitutionalLookupResponse | null> {
    const trimmedId = id.trim().toUpperCase();
    if (!trimmedId) return null;

    // 1. In browser runtime, attempt POST /api/auth/lookup
    if (typeof window !== "undefined") {
      try {
        const response = await fetch("/api/auth/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ institutionalId: trimmedId }),
        });

        if (response.ok) {
          const payload = await response.json();
          if (payload.success && payload.profile) {
            return payload.profile;
          }
        }
      } catch {
        // Fallback to client directory
      }
    }

    // 2. Direct catalog lookup fallback using deterministic mock directory
    const match = MOCK_INSTITUTIONAL_DIRECTORY.find(
      (u) => u.institutionalId.toUpperCase() === trimmedId
    );

    if (match) {
      const { rawPhone: _raw, email: _email, ...profileOnly } = match;
      return profileOnly;
    }

    return null;
  }
}

/**
 * Singleton instance of mock identity lookup service.
 */
export const mockIdentityService = new MockIdentityLookupService();
