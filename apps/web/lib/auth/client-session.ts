import { InstitutionalLookupResponse } from "@smart-campus/contracts";

export const CAMPUSGRAM_ONBOARDING_KEY = "campusgram_onboarding_completed";
export const CAMPUSGRAM_SESSION_KEY = "campusgram_mock_session";

export function isMockAuthMode(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_MODE === "mock" || process.env.NODE_ENV === "test";
}

/**
 * Checks if the user has completed the onboarding tour.
 */
export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CAMPUSGRAM_ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Marks onboarding as completed or uncompleted.
 */
export function setOnboardingCompleted(completed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (completed) {
      localStorage.setItem(CAMPUSGRAM_ONBOARDING_KEY, "true");
    } else {
      localStorage.removeItem(CAMPUSGRAM_ONBOARDING_KEY);
    }
  } catch {
    // LocalStorage may fail in private mode or quota exceeded
  }
}

/**
 * Resets onboarding state so it can be viewed again.
 */
export function resetOnboarding(): void {
  setOnboardingCompleted(false);
}

/**
 * Retrieves the currently active mock authenticated session profile.
 */
export function getMockSession(): InstitutionalLookupResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CAMPUSGRAM_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InstitutionalLookupResponse;
  } catch {
    return null;
  }
}

/**
 * Saves the active mock session profile.
 */
export function setMockSession(profile: InstitutionalLookupResponse): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CAMPUSGRAM_SESSION_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event("campusgram:session_changed"));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears the mock session (logout).
 */
export function clearMockSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CAMPUSGRAM_SESSION_KEY);
    window.dispatchEvent(new Event("campusgram:session_changed"));
  } catch {
    // Ignore storage errors
  }
}
