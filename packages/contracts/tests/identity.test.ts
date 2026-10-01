import { describe, it, expect } from "vitest";
import {
  InstitutionalLookupRequestSchema,
  InstitutionalLookupResponseSchema,
  VerifyOtpRequestSchema,
  InstitutionalRoleSchema,
  InstitutionalTagSchema,
  InstitutionalUserSchema,
} from "../src/identity";

describe("Institutional Identity Contracts", () => {
  describe("InstitutionalRoleSchema", () => {
    it("accepts valid institutional roles", () => {
      expect(InstitutionalRoleSchema.parse("student")).toBe("student");
      expect(InstitutionalRoleSchema.parse("faculty")).toBe("faculty");
      expect(InstitutionalRoleSchema.parse("staff")).toBe("staff");
      expect(InstitutionalRoleSchema.parse("admin")).toBe("admin");
    });

    it("rejects unknown roles", () => {
      expect(() => InstitutionalRoleSchema.parse("guest")).toThrow();
      expect(() => InstitutionalRoleSchema.parse("superuser")).toThrow();
    });
  });

  describe("InstitutionalTagSchema", () => {
    it("validates all required responsibility tags", () => {
      const tags = [
        "CAS_COORDINATOR",
        "DEPARTMENT_COORDINATOR",
        "COURSE_COORDINATOR",
        "CLASS_COORDINATOR",
        "HOD",
      ];
      for (const tag of tags) {
        expect(InstitutionalTagSchema.parse(tag)).toBe(tag);
      }
    });

    it("rejects unauthorized or arbitrary tags", () => {
      expect(() => InstitutionalTagSchema.parse("HEAD_BOY")).toThrow();
      expect(() => InstitutionalTagSchema.parse("PRESIDENT")).toThrow();
    });
  });

  describe("InstitutionalLookupRequestSchema", () => {
    it("accepts valid alphanumeric institutional IDs", () => {
      expect(InstitutionalLookupRequestSchema.parse({ institutionalId: "STU2026001" }))
        .toEqual({ institutionalId: "STU2026001" });
      expect(InstitutionalLookupRequestSchema.parse({ institutionalId: "FAC-1001" }))
        .toEqual({ institutionalId: "FAC-1001" });
      expect(InstitutionalLookupRequestSchema.parse({ institutionalId: "ADM_9001" }))
        .toEqual({ institutionalId: "ADM_9001" });
    });

    it("trims whitespace from input", () => {
      const res = InstitutionalLookupRequestSchema.parse({ institutionalId: "  STU2026001  " });
      expect(res.institutionalId).toBe("STU2026001");
    });

    it("rejects institutional IDs that are too short", () => {
      expect(() => InstitutionalLookupRequestSchema.parse({ institutionalId: "AB" })).toThrow();
    });

    it("rejects institutional IDs with invalid characters", () => {
      expect(() => InstitutionalLookupRequestSchema.parse({ institutionalId: "STU 2026" })).toThrow();
      expect(() => InstitutionalLookupRequestSchema.parse({ institutionalId: "STU@2026" })).toThrow();
      expect(() => InstitutionalLookupRequestSchema.parse({ institutionalId: "STU;DROP TABLE" })).toThrow();
    });
  });

  describe("VerifyOtpRequestSchema", () => {
    it("accepts exactly 6-digit numeric OTPs", () => {
      const valid = VerifyOtpRequestSchema.parse({
        institutionalId: "STU2026001",
        otp: "123456",
      });
      expect(valid.otp).toBe("123456");
    });

    it("rejects OTPs with non-digit characters", () => {
      expect(() =>
        VerifyOtpRequestSchema.parse({
          institutionalId: "STU2026001",
          otp: "12345A",
        })
      ).toThrow();
    });

    it("rejects OTPs with incorrect length", () => {
      expect(() =>
        VerifyOtpRequestSchema.parse({
          institutionalId: "STU2026001",
          otp: "12345",
        })
      ).toThrow();
      expect(() =>
        VerifyOtpRequestSchema.parse({
          institutionalId: "STU2026001",
          otp: "1234567",
        })
      ).toThrow();
    });
  });

  describe("Multi-Responsibility Tag Validation", () => {
    it("validates a user with multiple simultaneous responsibilities", () => {
      const hodUser = InstitutionalUserSchema.parse({
        id: "44444444-4444-4444-4444-444444440011",
        institutionalId: "FAC1011",
        fullName: "Dr. Aris Thorne",
        email: "hod.cse@campus.edu",
        primaryRole: "faculty",
        isActive: true,
        tags: ["HOD", "DEPARTMENT_COORDINATOR"],
      });

      expect(hodUser.tags).toHaveLength(2);
      expect(hodUser.tags).toContain("HOD");
      expect(hodUser.tags).toContain("DEPARTMENT_COORDINATOR");
    });

    it("validates an institutional lookup response contract", () => {
      const response = InstitutionalLookupResponseSchema.parse({
        id: "33333333-3333-3333-3333-333333330001",
        institutionalId: "STU2026001",
        fullName: "Aarav Sharma",
        maskedPhone: "+91 ******0001",
        role: "student",
        departmentCode: "CSE",
        departmentName: "Computer Science & Engineering",
        programCode: "BTECH_CSE",
        programName: "Bachelor of Technology in Computer Science & Engineering",
        academicYear: 3,
        semester: 6,
        section: "A",
        tags: ["CAS_COORDINATOR"],
        isActive: true,
      });

      expect(response.maskedPhone).toBe("+91 ******0001");
      expect(response.tags).toEqual(["CAS_COORDINATOR"]);
    });
  });
});
