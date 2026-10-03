import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { mockIdentityService } from "../lib/services/identity-service";
import {
  isOnboardingCompleted,
  setOnboardingCompleted,
  resetOnboarding,
  getMockSession,
  setMockSession,
  clearMockSession,
  CAMPUSGRAM_ONBOARDING_KEY,
  CAMPUSGRAM_SESSION_KEY,
} from "../lib/auth/client-session";
import {
  MOCK_ACADEMIC_DOCUMENTS,
  MOCK_NON_ACADEMIC_DOCUMENTS,
} from "../lib/services/documents-data";
import { InstitutionalLookupResponse } from "@smart-campus/contracts";

class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string) {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

describe("Module 1: CampusGram Frontend & Mock Services", () => {
  beforeAll(() => {
    const mockStorage = new LocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: mockStorage,
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      writable: true,
    });
  });

  beforeEach(() => {
    localStorage.clear();
  });

  describe("Onboarding State & Persistence", () => {
    it("reports onboarding as uncompleted initially", () => {
      expect(isOnboardingCompleted()).toBe(false);
    });

    it("persists onboarding completion flag", () => {
      setOnboardingCompleted(true);
      expect(isOnboardingCompleted()).toBe(true);
      expect(localStorage.getItem(CAMPUSGRAM_ONBOARDING_KEY)).toBe("true");
    });

    it("resets onboarding state cleanly for demonstrations", () => {
      setOnboardingCompleted(true);
      expect(isOnboardingCompleted()).toBe(true);

      resetOnboarding();
      expect(isOnboardingCompleted()).toBe(false);
      expect(localStorage.getItem(CAMPUSGRAM_ONBOARDING_KEY)).toBeNull();
    });
  });

  describe("Mock Identity Service & College ID Lookup", () => {
    it("looks up existing student ID STU2026001 successfully", async () => {
      const profile = await mockIdentityService.lookupByInstitutionalId("STU2026001");
      expect(profile).not.toBeNull();
      expect(profile?.institutionalId).toBe("STU2026001");
      expect(profile?.fullName).toBe("Aarav Sharma");
      expect(profile?.role).toBe("student");
      expect(profile?.departmentCode).toBe("CSE");
      expect(profile?.programCode).toBe("BTECH_CSE");
      expect(profile?.academicYear).toBe(3);
      expect(profile?.semester).toBe(6);
      expect(profile?.section).toBe("A");
      expect(profile?.tags).toContain("CAS_COORDINATOR");
      expect(profile?.isActive).toBe(true);
    });

    it("handles lowercase and whitespace in College ID lookup", async () => {
      const profileLower = await mockIdentityService.lookupByInstitutionalId("stu2026001");
      expect(profileLower).not.toBeNull();
      expect(profileLower?.institutionalId).toBe("STU2026001");

      const profilePadded = await mockIdentityService.lookupByInstitutionalId("  STU2026001  ");
      expect(profilePadded).not.toBeNull();
      expect(profilePadded?.institutionalId).toBe("STU2026001");
    });

    it("looks up faculty member with academic designation", async () => {
      const profile = await mockIdentityService.lookupByInstitutionalId("FAC1001");
      expect(profile).not.toBeNull();
      expect(profile?.institutionalId).toBe("FAC1001");
      expect(profile?.fullName).toBe("Dr. Sundar Pichai");
      expect(profile?.role).toBe("faculty");
      expect(profile?.designation).toBe("Professor");
      expect(profile?.departmentCode).toBe("CSE");
    });

    it("looks up Head of Department (HOD) with responsibility tags", async () => {
      const profile = await mockIdentityService.lookupByInstitutionalId("FAC1011");
      expect(profile).not.toBeNull();
      expect(profile?.fullName).toBe("Dr. Aris Thorne");
      expect(profile?.role).toBe("faculty");
      expect(profile?.tags).toEqual(
        expect.arrayContaining(["HOD", "DEPARTMENT_COORDINATOR"])
      );
    });

    it("returns null for non-existent or invalid institutional ID", async () => {
      const notFound = await mockIdentityService.lookupByInstitutionalId("INVALID999");
      expect(notFound).toBeNull();

      const empty = await mockIdentityService.lookupByInstitutionalId("");
      expect(empty).toBeNull();

      const spaces = await mockIdentityService.lookupByInstitutionalId("   ");
      expect(spaces).toBeNull();
    });

    it("strictly preserves contact privacy by guaranteeing masked phone format", async () => {
      const profile = await mockIdentityService.lookupByInstitutionalId("STU2026001");
      expect(profile?.maskedPhone).toMatch(/\*{4,}\d{4}/);
      // Raw unmasked phone must never exist on profile contract
      expect((profile as any).rawPhone).toBeUndefined();
    });
  });

  describe("Session Storage & Mock Verification Flow", () => {
    it("stores and retrieves mock authenticated session", async () => {
      const profile = await mockIdentityService.lookupByInstitutionalId("STU2026001");
      expect(profile).not.toBeNull();

      expect(getMockSession()).toBeNull();

      setMockSession(profile as InstitutionalLookupResponse);
      const session = getMockSession();

      expect(session).not.toBeNull();
      expect(session?.institutionalId).toBe("STU2026001");
      expect(session?.fullName).toBe("Aarav Sharma");
    });

    it("clears mock authenticated session on logout", async () => {
      const profile = await mockIdentityService.lookupByInstitutionalId("STU2026001");
      setMockSession(profile as InstitutionalLookupResponse);
      expect(getMockSession()).not.toBeNull();

      clearMockSession();
      expect(getMockSession()).toBeNull();
      expect(localStorage.getItem(CAMPUSGRAM_SESSION_KEY)).toBeNull();
    });
  });

  describe("Academic & Non-Academic Documents Catalog", () => {
    it("contains comprehensive academic documents with required details", () => {
      expect(MOCK_ACADEMIC_DOCUMENTS.length).toBeGreaterThanOrEqual(6);

      const titles = MOCK_ACADEMIC_DOCUMENTS.map((d) => d.title);
      expect(titles).toContain("Institutional Digital ID");
      expect(titles).toContain("Bonafide Certificate");
      expect(titles).toContain("Semester Grade Card");
      expect(titles).toContain("Attendance Record");
      expect(titles).toContain("Course Registration Sheet");
      expect(titles).toContain("Academic Transcript");

      for (const doc of MOCK_ACADEMIC_DOCUMENTS) {
        expect(doc.category).toBe("academic");
        expect(doc.documentNumber).toBeTruthy();
        expect(doc.details.issuer).toBeTruthy();
        expect(doc.details.verifiedBy).toBeTruthy();
      }
    });

    it("contains non-academic documents with required details", () => {
      expect(MOCK_NON_ACADEMIC_DOCUMENTS.length).toBeGreaterThanOrEqual(6);

      const titles = MOCK_NON_ACADEMIC_DOCUMENTS.map((d) => d.title);
      expect(titles).toContain("Campus Event Permission");
      expect(titles).toContain("Hostel Gate & Room Pass");
      expect(titles).toContain("Campus Transport Pass");
      expect(titles).toContain("Technical Society Membership");
      expect(titles).toContain("Inter-College Sports Credential");
      expect(titles).toContain("Innovation Lab 24/7 Access");

      for (const doc of MOCK_NON_ACADEMIC_DOCUMENTS) {
        expect(doc.category).toBe("non-academic");
        expect(doc.documentNumber).toBeTruthy();
        expect(doc.details.issuer).toBeTruthy();
        expect(doc.details.verifiedBy).toBeTruthy();
      }
    });
  });
});
