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

// In-memory cache & in-flight deduplication state
let cachedAlertsData: { data: EmergencyDataResponse; timestamp: number } | null = null;
let activeAlertsPromise: Promise<EmergencyDataResponse> | null = null;

let cachedReportsData: { data: { success: boolean; reports: EmergencyReport[] }; timestamp: number } | null = null;
let activeReportsPromise: Promise<{ success: boolean; reports: EmergencyReport[] }> | null = null;

const CACHE_TTL_MS = 15_000; // 15 seconds freshness window for non-mutating checks

export const emergencyClientService = {
  /**
   * Fetches active emergency alerts with in-flight deduplication and short TTL caching.
   * If forceRefresh is true, bypasses cache and re-fetches immediately.
   */
  async getAlerts(forceRefresh = false): Promise<EmergencyDataResponse> {
    const now = Date.now();

    // 1. Serve from fresh cache if valid and not forcing refresh
    if (!forceRefresh && cachedAlertsData && now - cachedAlertsData.timestamp < CACHE_TTL_MS) {
      return cachedAlertsData.data;
    }

    // 2. Reuse in-flight request to avoid duplicate parallel requests
    if (activeAlertsPromise && !forceRefresh) {
      return activeAlertsPromise;
    }

    activeAlertsPromise = (async () => {
      try {
        const res = await fetch("/api/emergency/alerts", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch alerts");
        const json: EmergencyDataResponse = await res.json();

        if (json.success) {
          cachedAlertsData = { data: json, timestamp: Date.now() };
        }
        return json;
      } catch {
        // Return stale cache if available during transient network drop
        if (cachedAlertsData) return cachedAlertsData.data;
        return { success: false, alerts: [], active: [], hotlines: [] };
      } finally {
        activeAlertsPromise = null;
      }
    })();

    return activeAlertsPromise;
  },

  /**
   * Fetches reported incidents with deduplication and TTL caching.
   */
  async getReports(forceRefresh = false): Promise<{ success: boolean; reports: EmergencyReport[] }> {
    const now = Date.now();

    if (!forceRefresh && cachedReportsData && now - cachedReportsData.timestamp < CACHE_TTL_MS) {
      return cachedReportsData.data;
    }

    if (activeReportsPromise && !forceRefresh) {
      return activeReportsPromise;
    }

    activeReportsPromise = (async () => {
      try {
        const res = await fetch("/api/emergency/reports", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch reports");
        const json = await res.json();

        if (json.success) {
          cachedReportsData = { data: json, timestamp: Date.now() };
        }
        return json;
      } catch {
        if (cachedReportsData) return cachedReportsData.data;
        return { success: false, reports: [] };
      } finally {
        activeReportsPromise = null;
      }
    })();

    return activeReportsPromise;
  },

  /**
   * Submits a new 1-tap SOS report and immediately invalidates cache.
   */
  async submitReport(input: CreateEmergencyReportInput): Promise<{ success: boolean; message: string; report?: EmergencyReport }> {
    try {
      const res = await fetch("/api/emergency/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      // Invalidate reports and alerts cache on mutation
      cachedReportsData = null;
      cachedAlertsData = null;
      return data;
    } catch {
      return { success: false, message: "Network transmission error" };
    }
  },

  /**
   * Broadcasts an official campus emergency alert and invalidates cache.
   */
  async broadcastAlert(input: CreateEmergencyAlertInput): Promise<{ success: boolean; message: string; alert?: EmergencyAlert }> {
    try {
      const res = await fetch("/api/emergency/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      // Invalidate cache immediately so new broadcast is live instantly
      cachedAlertsData = null;
      return data;
    } catch {
      return { success: false, message: "Failed to broadcast alert" };
    }
  },

  /**
   * Submits student/staff safety check-in status.
   */
  async checkIn(input: SafetyCheckIn): Promise<{ success: boolean; message: string; totalSafe?: number }> {
    try {
      const res = await fetch("/api/emergency/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      cachedAlertsData = null;
      return data;
    } catch {
      return { success: false, message: "Failed to register safety check-in" };
    }
  },

  /**
   * Explicitly clear cache (for test resetting or logout).
   */
  clearCache() {
    cachedAlertsData = null;
    cachedReportsData = null;
    activeAlertsPromise = null;
    activeReportsPromise = null;
  },
};
