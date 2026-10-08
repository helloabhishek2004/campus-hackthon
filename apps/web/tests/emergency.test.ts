import { describe, it, expect } from "vitest";
import { CreateEmergencyAlertInput, CreateEmergencyReportInput, EmergencyAlert, EmergencyReport } from "@smart-campus/contracts";
import { EmergencyService } from "../lib/emergency/emergency-service";
import type { EmergencyIdentity, EmergencyRepository } from "../lib/emergency/emergency-repository";

function testRepository(): EmergencyRepository {
  const alerts: EmergencyAlert[] = [{
    id: "test-alert-1",
    kind: "alert",
    severity: "warning",
    scope: "campus_wide",
    title: "Test alert",
    body: "Test emergency alert for check-in coverage.",
    channels: ["in_app"],
    is_drill: true,
    status: "sent",
    drafted_by_name: "Test Responder",
    created_at: new Date().toISOString(),
  }];
  const reports: EmergencyReport[] = [];
  const checkIns = new Map<string, "safe" | "need_help">();
  let sequence = 1;

  return {
    async listReports(identity, canViewAll) {
      return canViewAll ? reports : reports.filter((report) => report.reporter_id === identity.userId);
    },
    async listAlerts() {
      return { alerts, active: alerts.filter((alert) => alert.status === "sent") };
    },
    async createReport(input, identity, priority) {
      const duplicate = reports.find((report) => report.reporter_id === identity.userId && report.type === input.type && report.location_name === input.location_name && report.description === input.description);
      if (duplicate) return duplicate;
      const report: EmergencyReport = {
        id: `report-${sequence++}`,
        public_ref: `EMR-2026-${sequence}`,
        type: input.type,
        location_name: input.location_name,
        location_note: input.location_note,
        geo_lat: input.geo_lat,
        geo_lng: input.geo_lng,
        description: input.description,
        priority,
        status: priority === 1 ? "verifying" : "submitted",
        reporter_name: identity.fullName,
        reporter_id: identity.userId,
        is_drill: Boolean(input.is_drill),
        created_at: new Date().toISOString(),
      };
      reports.unshift(report);
      return report;
    },
    async createAlert(input, identity) {
      const duplicate = alerts.find((alert) => alert.drafted_by_name === identity.fullName && alert.title === input.title && alert.body === input.body);
      if (duplicate) return duplicate;
      const alert: EmergencyAlert = {
        id: `alert-${sequence++}`,
        kind: input.kind,
        severity: input.severity,
        scope: input.scope,
        title: input.title,
        body: input.body,
        channels: input.channels,
        is_drill: Boolean(input.is_drill),
        status: "sent",
        drafted_by_name: identity.fullName,
        assembly_point: input.assembly_point,
        action_required: input.action_required,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      alerts.unshift(alert);
      return alert;
    },
    async recordCheckIn(input, identity) {
      if (!alerts.some((alert) => alert.id === input.alert_id && alert.status === "sent")) throw new Error("Active emergency alert not found.");
      checkIns.set(`${input.alert_id}:${identity.userId}`, input.status);
      return {
        success: true,
        totalSafe: [...checkIns.entries()].filter(([key, status]) => key.startsWith(`${input.alert_id}:`) && status === "safe").length,
      };
    },
  };
}

const identity: EmergencyIdentity = { userId: "student-1", fullName: "Test Student" };
const emergencyService = new EmergencyService(testRepository());

describe("Module 4: Emergency Alert System Service", () => {
  it("provides active alerts and emergency hotlines", async () => {
    const active = await emergencyService.getActiveAlerts();
    expect(active).toHaveLength(1);
    expect(emergencyService.getHotlines().length).toBeGreaterThanOrEqual(5);
  });

  it("calculates priority 1 for active fire and smoke threats", async () => {
    const input: CreateEmergencyReportInput = {
      type: "fire", location_name: "Library 2nd Floor", description: "Thick smoke and fire visible near east stairwell", reporter_name: "Client-controlled name must be ignored",
    };
    const report = await emergencyService.createReport(input, identity);
    expect(report.priority).toBe(1);
    expect(report.status).toBe("verifying");
    expect(report.reporter_name).toBe("Test Student");
  });

  it("protects against repeated SOS submissions through the repository", async () => {
    const input: CreateEmergencyReportInput = { type: "medical", location_name: "Hostel Block C", description: "Student needs first aid" };
    const first = await emergencyService.createReport(input, identity);
    const second = await emergencyService.createReport(input, identity);
    expect(second.id).toBe(first.id);
  });

  it("persists an authorized broadcast and prevents duplicate broadcasts", async () => {
    const input: CreateEmergencyAlertInput = {
      title: "TEST DRILL: Evacuate Quadrangle", body: "This is a routine drill exercise. Proceed to Assembly Point A.", severity: "warning", scope: "campus_wide", kind: "alert", channels: ["in_app", "sms", "push"], is_drill: true, assembly_point: "Assembly Point A",
    };
    const first = await emergencyService.broadcastAlert(input, { userId: "staff-1", fullName: "Campus Security Head" });
    const second = await emergencyService.broadcastAlert(input, { userId: "staff-1", fullName: "Campus Security Head" });
    expect(first.status).toBe("sent");
    expect(first.channels).toContain("sms");
    expect(second.id).toBe(first.id);
  });

  it("upserts safety check-ins and counts safe users", async () => {
    const result = await emergencyService.recordSafetyCheckIn({ alert_id: "test-alert-1", status: "safe", user_id: "client-value" }, identity);
    expect(result.success).toBe(true);
    expect(result.totalSafe).toBe(1);
    const updated = await emergencyService.recordSafetyCheckIn({ alert_id: "test-alert-1", status: "need_help", user_id: "another-client-value" }, identity);
    expect(updated.totalSafe).toBe(0);
  });

  it("surfaces persistence failures instead of returning fake success", async () => {
    const failingService = new EmergencyService({
      ...testRepository(),
      createReport: async () => { throw new Error("Emergency report persistence failed: database unavailable"); },
    });
    await expect(failingService.createReport({
      type: "other", location_name: "Library", description: "Database failure test", is_drill: true,
    }, identity)).rejects.toThrow("database unavailable");
  });

  it("rejects check-ins for missing or inactive alerts", async () => {
    await expect(emergencyService.recordSafetyCheckIn({
      alert_id: "missing-alert", status: "safe",
    }, identity)).rejects.toThrow("Active emergency alert not found");
  });
});
