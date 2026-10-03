import {
  EmergencyAlert,
  EmergencyReport,
  CreateEmergencyAlertInput,
  CreateEmergencyReportInput,
  SafetyCheckIn,
} from "@smart-campus/contracts";
import { EmergencyContact } from "../emergency/emergency-service";

export interface EmergencyDataResponse {
  success: boolean;
  alerts: EmergencyAlert[];
  active: EmergencyAlert[];
  hotlines: EmergencyContact[];
}

export const emergencyClientService = {
  async getAlerts(): Promise<EmergencyDataResponse> {
    try {
      const res = await fetch("/api/emergency/alerts", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return await res.json();
    } catch {
      return { success: false, alerts: [], active: [], hotlines: [] };
    }
  },

  async getReports(): Promise<{ success: boolean; reports: EmergencyReport[] }> {
    try {
      const res = await fetch("/api/emergency/reports", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return await res.json();
    } catch {
      return { success: false, reports: [] };
    }
  },

  async submitReport(input: CreateEmergencyReportInput): Promise<{ success: boolean; message: string; report?: EmergencyReport }> {
    const res = await fetch("/api/emergency/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await res.json();
  },

  async broadcastAlert(input: CreateEmergencyAlertInput): Promise<{ success: boolean; message: string; alert?: EmergencyAlert }> {
    const res = await fetch("/api/emergency/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await res.json();
  },

  async checkIn(input: SafetyCheckIn): Promise<{ success: boolean; message: string; totalSafe?: number }> {
    const res = await fetch("/api/emergency/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await res.json();
  },
};
