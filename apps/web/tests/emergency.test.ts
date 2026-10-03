import { describe, it, expect } from "vitest";
import { emergencyService } from "../lib/emergency/emergency-service";
import { CreateEmergencyReportInput, CreateEmergencyAlertInput } from "@smart-campus/contracts";

describe("Module 4: Emergency Alert System Service", () => {
  it("provides initial active alerts and emergency hotlines", () => {
    const active = emergencyService.getActiveAlerts();
    expect(Array.isArray(active)).toBe(true);
    expect(active.length).toBeGreaterThan(0);

    const hotlines = emergencyService.getHotlines();
    expect(hotlines.length).toBeGreaterThanOrEqual(5);
    const security = hotlines.find((h) => h.category === "Security");
    expect(security).toBeDefined();
    expect(security?.isPrimarySOS).toBe(true);
  });

  it("calculates priority 1 for active fire and smoke threats", () => {
    const input: CreateEmergencyReportInput = {
      type: "fire",
      location_name: "Library 2nd Floor",
      description: "Thick smoke and fire visible near east stairwell",
      reporter_name: "Test Student",
    };

    const report = emergencyService.createReport(input);
    expect(report.priority).toBe(1);
    expect(report.status).toBe("verifying");
    expect(report.public_ref).toMatch(/^EMR-2026-\d+$/);
  });

  it("calculates priority 2 for elevator faults and trapped reports", () => {
    const input: CreateEmergencyReportInput = {
      type: "building_problem",
      location_name: "Hostel Block C Lift",
      description: "Lift is stuck with students trapped inside",
      reporter_name: "Warden Office",
    };

    const report = emergencyService.createReport(input);
    expect(report.priority).toBe(2);
  });

  it("broadcasts emergency alerts across channels and logs them", () => {
    const input: CreateEmergencyAlertInput = {
      title: "TEST DRILL: Evacuate Quadrangle",
      body: "This is a routine drill exercise. Please proceed to Assembly Point A.",
      severity: "warning",
      scope: "campus_wide",
      kind: "alert",
      channels: ["in_app", "sms", "push"],
      is_drill: true,
      assembly_point: "Assembly Point A",
    };

    const alert = emergencyService.broadcastAlert(input, "Campus Security Head");
    expect(alert.status).toBe("sent");
    expect(alert.is_drill).toBe(true);
    expect(alert.channels).toContain("sms");

    const all = emergencyService.getAllAlerts();
    const found = all.find((a) => a.id === alert.id);
    expect(found).toBeDefined();
  });

  it("records safety check-in responses correctly", () => {
    const res = emergencyService.recordSafetyCheckIn({
      alert_id: "test-alert-1",
      status: "safe",
      user_id: "12345",
    });

    expect(res.success).toBe(true);
    expect(res.totalSafe).toBeGreaterThanOrEqual(1);

    const stats = emergencyService.getCheckInStats("test-alert-1");
    expect(stats.safe).toBeGreaterThanOrEqual(1);
  });
});
