import { createHash } from "node:crypto";
import type {
  CreateEmergencyAlertInput,
  CreateEmergencyReportInput,
  EmergencyAlert,
  EmergencyReport,
  SafetyCheckIn,
} from "@smart-campus/contracts";
import { createServiceClient } from "../supabase/server";

export interface EmergencyIdentity {
  userId: string;
  fullName: string;
  profileId?: string;
}

export interface EmergencyRepository {
  listReports(identity: EmergencyIdentity, canViewAll: boolean): Promise<EmergencyReport[]>;
  listAlerts(): Promise<{ alerts: EmergencyAlert[]; active: EmergencyAlert[] }>;
  createReport(input: CreateEmergencyReportInput, identity: EmergencyIdentity, priority: 1 | 2 | 3 | 4): Promise<EmergencyReport>;
  createAlert(input: CreateEmergencyAlertInput, identity: EmergencyIdentity): Promise<EmergencyAlert>;
  recordCheckIn(input: SafetyCheckIn, identity: EmergencyIdentity): Promise<{ success: boolean; totalSafe: number }>;
}

const hashKey = (value: string) => createHash("sha256").update(value).digest("hex");
const timeBucket = () => Math.floor(Date.now() / 30_000);

function reportFromRow(row: any): EmergencyReport {
  return {
    id: row.id,
    public_ref: row.public_ref,
    type: row.type,
    location_name: row.location_name,
    location_note: row.location_note ?? undefined,
    geo_lat: row.geo_lat ?? undefined,
    geo_lng: row.geo_lng ?? undefined,
    description: row.description,
    priority: row.priority,
    status: row.status,
    reporter_name: row.reporter_name,
    reporter_id: row.reporter_id,
    is_drill: Boolean(row.is_drill),
    created_at: row.created_at,
    resolved_at: row.resolved_at ?? undefined,
  };
}

function alertFromRow(row: any): EmergencyAlert {
  return {
    id: row.id,
    incident_id: row.incident_id ?? undefined,
    kind: row.kind,
    severity: row.severity,
    scope: row.scope,
    title: row.title,
    body: row.body,
    channels: row.channels,
    is_drill: Boolean(row.is_drill),
    status: row.status,
    drafted_by_name: row.drafted_by_name,
    assembly_point: row.assembly_point ?? undefined,
    action_required: row.action_required ?? undefined,
    sent_at: row.sent_at ?? undefined,
    created_at: row.created_at,
  };
}

function throwDatabaseError(operation: string, error: any): never {
  throw new Error(`${operation} failed: ${error?.message || "database error"}`);
}

export function createSupabaseEmergencyRepository(): EmergencyRepository {
  return {
    async listReports(identity, canViewAll) {
      const query = createServiceClient().from("emergency_reports").select("*").order("created_at", { ascending: false });
      const { data, error } = canViewAll ? await query : await query.eq("reporter_id", identity.userId);
      if (error) throwDatabaseError("Emergency report lookup", error);
      return (data || []).map(reportFromRow);
    },

    async listAlerts() {
      const { data, error } = await createServiceClient()
        .from("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throwDatabaseError("Emergency alert lookup", error);
      const alerts = (data || []).map(alertFromRow);
      return { alerts, active: alerts.filter((alert) => alert.status === "sent") };
    },

    async createReport(input, identity, priority) {
      const dedupeKey = hashKey([
        identity.userId,
        input.type,
        input.location_name.trim().toLowerCase(),
        input.description.trim().toLowerCase(),
        timeBucket(),
      ].join("|"));
      const client = createServiceClient();
      const { data: existing, error: existingError } = await client
        .from("emergency_reports")
        .select("*")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (existingError) throwDatabaseError("Emergency duplicate check", existingError);
      if (existing) return reportFromRow(existing);

      const publicRef = `EMR-${new Date().getUTCFullYear()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
      const { data, error } = await client
        .from("emergency_reports")
        .insert({
          public_ref: publicRef,
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
          reporter_profile_id: identity.profileId,
          is_drill: Boolean(input.is_drill),
          dedupe_key: dedupeKey,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          const { data: retry } = await client.from("emergency_reports").select("*").eq("dedupe_key", dedupeKey).maybeSingle();
          if (retry) return reportFromRow(retry);
        }
        throwDatabaseError("Emergency report persistence", error);
      }
      return reportFromRow(data);
    },

    async createAlert(input, identity) {
      const dedupeKey = hashKey([
        identity.userId,
        input.kind,
        input.title.trim().toLowerCase(),
        input.body.trim().toLowerCase(),
        timeBucket(),
      ].join("|"));
      const client = createServiceClient();
      const { data: existing, error: existingError } = await client
        .from("emergency_alerts")
        .select("*")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (existingError) throwDatabaseError("Emergency broadcast duplicate check", existingError);
      if (existing) return alertFromRow(existing);

      const now = new Date().toISOString();
      const { data, error } = await client
        .from("emergency_alerts")
        .insert({
          kind: input.kind,
          severity: input.severity,
          scope: input.scope,
          title: input.title,
          body: input.body,
          channels: input.channels,
          is_drill: Boolean(input.is_drill),
          status: "sent",
          drafted_by_name: identity.fullName,
          drafted_by_id: identity.userId,
          drafted_by_profile_id: identity.profileId,
          assembly_point: input.assembly_point,
          action_required: input.action_required,
          dedupe_key: dedupeKey,
          sent_at: now,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          const { data: retry } = await client.from("emergency_alerts").select("*").eq("dedupe_key", dedupeKey).maybeSingle();
          if (retry) return alertFromRow(retry);
        }
        throwDatabaseError("Emergency broadcast persistence", error);
      }
      return alertFromRow(data);
    },

    async recordCheckIn(input, identity) {
      const client = createServiceClient();
      const { data: alert, error: alertError } = await client
        .from("emergency_alerts")
        .select("id")
        .eq("id", input.alert_id)
        .eq("status", "sent")
        .maybeSingle();
      if (alertError) throwDatabaseError("Emergency alert validation", alertError);
      if (!alert) throw new Error("Active emergency alert not found.");

      const { error } = await client.from("emergency_check_ins").upsert({
        alert_id: input.alert_id,
        user_id: identity.userId,
        user_profile_id: identity.profileId,
        status: input.status,
        location_note: input.location_note,
      }, { onConflict: "alert_id,user_id" });
      if (error) throwDatabaseError("Emergency check-in persistence", error);

      const { count, error: countError } = await client
        .from("emergency_check_ins")
        .select("user_id", { count: "exact", head: true })
        .eq("alert_id", input.alert_id)
        .eq("status", "safe");
      if (countError) throwDatabaseError("Emergency check-in count", countError);
      return { success: true, totalSafe: count || 0 };
    },
  };
}
