import {
  EmergencyAlert,
  EmergencyReport,
  EmergencyIncident,
  CreateEmergencyReportInput,
  CreateEmergencyAlertInput,
  SafetyCheckIn,
  EmergencyType,
  EmergencySeverity,
} from "@smart-campus/contracts";

export interface EmergencyContact {
  id: string;
  name: string;
  category: "Security" | "Medical" | "Fire" | "Helpline" | "Administration";
  phone: string;
  ext: string;
  location: string;
  availableHours: string;
  isPrimarySOS: boolean;
}

export const CAMPUS_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "ec-1",
    name: "Central Security Control Room",
    category: "Security",
    phone: "+91 98765 00112",
    ext: "112",
    location: "Main Gate, Control Building GF",
    availableHours: "24/7 / 365 Days",
    isPrimarySOS: true,
  },
  {
    id: "ec-2",
    name: "Campus Health & Trauma Center",
    category: "Medical",
    phone: "+91 98765 00108",
    ext: "108",
    location: "Medical Center, Block C",
    availableHours: "24/7 Emergency Ambulance",
    isPrimarySOS: true,
  },
  {
    id: "ec-3",
    name: "Campus Fire Safety & Hazmat",
    category: "Fire",
    phone: "+91 98765 00101",
    ext: "101",
    location: "Engineering Workshop Complex",
    availableHours: "24/7 Rapid Response",
    isPrimarySOS: true,
  },
  {
    id: "ec-4",
    name: "Women's Safety & Internal Complaints Committee",
    category: "Helpline",
    phone: "+91 98765 00109",
    ext: "109",
    location: "Student Welfare Hall, 1st Floor",
    availableHours: "24/7 Confidential Helpline",
    isPrimarySOS: false,
  },
  {
    id: "ec-5",
    name: "Student Psychological Support & Counseling",
    category: "Helpline",
    phone: "+91 98765 00115",
    ext: "115",
    location: "Counseling Wing, Library 3rd Floor",
    availableHours: "8:00 AM - 10:00 PM",
    isPrimarySOS: false,
  },
  {
    id: "ec-6",
    name: "Chief Proctor & Campus Administration",
    category: "Administration",
    phone: "+91 98765 00120",
    ext: "120",
    location: "Administrative Block Room 102",
    availableHours: "9:00 AM - 6:00 PM",
    isPrimarySOS: false,
  },
];

// Seed active alerts
const INITIAL_ALERTS: EmergencyAlert[] = [
  {
    id: "alert-001",
    kind: "alert",
    severity: "warning",
    scope: "campus_wide",
    title: "SAFETY ADVISORY: Flash Storm & High Winds Warning",
    body: "Met department has issued yellow alert for high velocity winds across North Zone. Avoid open lawns and tree corridors near Academic Block B. Report waterlogging or broken branches immediately.",
    channels: ["in_app", "push"],
    is_drill: false,
    status: "sent",
    drafted_by_name: "Col. Rajesh Verma (Campus Security Head)",
    assembly_point: "Student Center Atrium",
    action_required: "Stay indoors during heavy showers. Keep emergency lines clear.",
    sent_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-002",
    kind: "all_clear",
    severity: "advisory",
    scope: "audience",
    title: "ALL CLEAR: Routine Fire Drill Completed at Science Complex",
    body: "The scheduled bi-annual emergency evacuation drill has concluded successfully. All exits are open, and normal class operations have resumed.",
    channels: ["in_app"],
    is_drill: true,
    status: "sent",
    drafted_by_name: "Fire Safety Team",
    assembly_point: "Central Sports Ground",
    action_required: "Resume scheduled lab sessions.",
    sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
];

// Seed emergency reports
const INITIAL_REPORTS: EmergencyReport[] = [
  {
    id: "rep-001",
    public_ref: "EMR-2026-081",
    type: "medical",
    location_name: "Sports Complex Badminton Court 3",
    location_note: "Ankle fracture during intramural match",
    description: "Student suffered severe ligament sprain or fracture. Needs immediate first aid splint and transport.",
    priority: 2,
    status: "resolved",
    reporter_name: "Rahul Verma (Sports Rep)",
    is_drill: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rep-002",
    public_ref: "EMR-2026-082",
    type: "building_problem",
    location_name: "Academic Block 4 - Lift 2",
    location_note: "Stuck between 3rd and 4th floors",
    description: "Lift stopped abruptly with 2 students inside. Intercom functional, power backup on.",
    priority: 2,
    status: "verified",
    reporter_name: "Pooja Nair (Faculty CS)",
    is_drill: false,
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
];

// Rule-based priority scoring
function calculatePriority(type: EmergencyType, text: string): 1 | 2 | 3 | 4 {
  const p1Types: EmergencyType[] = ["fire", "security_threat", "natural_disaster", "hazmat"];
  const p1Keywords = ["fire", "smoke", "explosion", "gun", "knife", "collapse", "electrocution", "unconscious", "bleeding"];
  const p2Keywords = ["fracture", "stuck", "flood", "leak", "faint", "attack", "trapped"];

  const lower = text.toLowerCase();

  if (p1Types.includes(type) || p1Keywords.some((kw) => lower.includes(kw))) {
    return 1;
  }

  if (type === "medical" || type === "accident" || type === "missing_person" || p2Keywords.some((kw) => lower.includes(kw))) {
    return 2;
  }

  return 3;
}

class EmergencyService {
  private alerts: EmergencyAlert[] = [...INITIAL_ALERTS];
  private reports: EmergencyReport[] = [...INITIAL_REPORTS];
  private checkIns: SafetyCheckIn[] = [];

  public getActiveAlerts(): EmergencyAlert[] {
    return this.alerts.filter((a) => a.status === "sent");
  }

  public getAllAlerts(): EmergencyAlert[] {
    return [...this.alerts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getReports(): EmergencyReport[] {
    return [...this.reports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getHotlines(): EmergencyContact[] {
    return CAMPUS_EMERGENCY_CONTACTS;
  }

  public createReport(
    input: CreateEmergencyReportInput,
    user?: { fullName: string; institutionalId?: string }
  ): EmergencyReport {
    const priority = calculatePriority(input.type, `${input.description} ${input.location_name}`);
    const reportId = `rep-${Date.now().toString(36)}`;
    const randomRefNum = Math.floor(100 + Math.random() * 900);
    const publicRef = `EMR-2026-${randomRefNum}`;

    const newReport: EmergencyReport = {
      id: reportId,
      public_ref: publicRef,
      type: input.type,
      location_name: input.location_name,
      location_note: input.location_note,
      geo_lat: input.geo_lat,
      geo_lng: input.geo_lng,
      description: input.description,
      priority,
      status: priority === 1 ? "verifying" : "submitted",
      reporter_name: user?.fullName || input.reporter_name || "Anonymous Campus Resident",
      reporter_id: user?.institutionalId,
      is_drill: Boolean(input.is_drill),
      created_at: new Date().toISOString(),
    };

    this.reports.unshift(newReport);
    return newReport;
  }

  public broadcastAlert(
    input: CreateEmergencyAlertInput,
    authorName: string = "Campus Emergency Command"
  ): EmergencyAlert {
    const alertId = `alert-${Date.now().toString(36)}`;
    const newAlert: EmergencyAlert = {
      id: alertId,
      kind: input.kind,
      severity: input.severity,
      scope: input.scope,
      title: input.title,
      body: input.body,
      channels: input.channels,
      is_drill: Boolean(input.is_drill),
      status: "sent",
      drafted_by_name: authorName,
      assembly_point: input.assembly_point,
      action_required: input.action_required,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    this.alerts.unshift(newAlert);
    return newAlert;
  }

  public recordSafetyCheckIn(checkIn: SafetyCheckIn): { success: boolean; totalSafe: number } {
    this.checkIns.push(checkIn);
    const totalSafe = this.checkIns.filter((c) => c.alert_id === checkIn.alert_id && c.status === "safe").length;
    return { success: true, totalSafe };
  }

  public getCheckInStats(alertId: string) {
    const forAlert = this.checkIns.filter((c) => c.alert_id === alertId);
    return {
      total: forAlert.length,
      safe: forAlert.filter((c) => c.status === "safe").length,
      needHelp: forAlert.filter((c) => c.status === "need_help").length,
    };
  }
}

export const emergencyService = new EmergencyService();
