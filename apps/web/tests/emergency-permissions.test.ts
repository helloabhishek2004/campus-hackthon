import { describe, expect, it } from "vitest";
import type { InstitutionalLookupResponse } from "@smart-campus/contracts";
import { canCreateEmergencyBroadcast, canViewAllEmergencyReports } from "../lib/emergency/emergency-permissions";

const profile = (overrides: Partial<InstitutionalLookupResponse> = {}): InstitutionalLookupResponse => ({
  id: "profile-1",
  institutionalId: "STU2026002",
  fullName: "Test User",
  maskedPhone: "******0002",
  role: "student",
  tags: [],
  isActive: true,
  ...overrides,
});

describe("Emergency authorization", () => {
  it("allows students to view only their own records", () => {
    expect(canViewAllEmergencyReports(profile())).toBe(false);
  });

  it("allows responders to view all reports", () => {
    expect(canViewAllEmergencyReports(profile({ role: "staff" }))).toBe(true);
    expect(canViewAllEmergencyReports(profile({ role: "faculty" }))).toBe(true);
  });

  it("blocks ordinary students from privileged broadcasts", () => {
    expect(canCreateEmergencyBroadcast(profile())).toBe(false);
  });

  it("allows defined staff roles and responsibility tags to broadcast", () => {
    expect(canCreateEmergencyBroadcast(profile({ role: "faculty" }))).toBe(true);
    expect(canCreateEmergencyBroadcast(profile({ tags: ["DEPARTMENT_COORDINATOR"] }))).toBe(true);
  });
});
