"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useCampusAuth } from "@/components/auth/auth-guard";
import {
  EmergencyAlert,
  EmergencyReport,
  EmergencyType,
  EmergencySeverity,
  EmergencyScope,
  AlertChannel,
} from "@smart-campus/contracts";
import {
  emergencyClientService,
  EmergencyDataResponse,
} from "@/lib/services/emergency-client-service";
import { EmergencyContact } from "@/lib/emergency/emergency-service";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  HeartPulse,
  Lock,
  Building,
  Radio,
  CheckCircle2,
  Phone,
  Clock,
  Send,
  MapPin,
  RefreshCw,
  Info,
  Check,
  Megaphone,
  UserCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

const EMERGENCY_TYPES: { type: EmergencyType; label: string; icon: any; isP1: boolean }[] = [
  { type: "fire", label: "Fire / Smoke", icon: Flame, isP1: true },
  { type: "medical", label: "Medical Trauma", icon: HeartPulse, isP1: true },
  { type: "security_threat", label: "Security Threat", icon: Lock, isP1: true },
  { type: "hazmat", label: "Gas / Hazmat", icon: AlertTriangle, isP1: true },
  { type: "building_problem", label: "Elevator / Trap", icon: Building, isP1: false },
  { type: "other", label: "Other Hazard", icon: Radio, isP1: false },
];

export default function EmergencyControlPage() {
  const { user } = useCampusAuth();

  const isStaffOrAdmin =
    user?.role === "faculty" ||
    user?.role === "admin" ||
    user?.tags?.some((r: string) =>
      ["HOD", "CAS_COORDINATOR", "DEPARTMENT_COORDINATOR"].includes(r)
    );


  // Data states
  const [data, setData] = useState<EmergencyDataResponse>({
    success: false,
    alerts: [],
    active: [],
    hotlines: [],
  });
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SOS Form state
  const [sosType, setSosType] = useState<EmergencyType>("medical");
  const [sosLocation, setSosLocation] = useState("");
  const [sosDescription, setSosDescription] = useState("");
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosFeedback, setSosFeedback] = useState<{ message: string; ref?: string } | null>(null);

  // Safety Check-In state
  const [checkedInAlerts, setCheckedInAlerts] = useState<Record<string, "safe" | "need_help">>({});
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);

  // Broadcast Composer state (for authorized staff)
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState<EmergencySeverity>("warning");
  const [broadcastScope, setBroadcastScope] = useState<EmergencyScope>("campus_wide");
  const [broadcastAssembly, setBroadcastAssembly] = useState("Central Sports Ground Assembly A");
  const [broadcastAction, setBroadcastAction] = useState("");
  const [broadcastIsDrill, setBroadcastIsDrill] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<AlertChannel[]>(["in_app", "push", "sms"]);
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"live" | "sos" | "hotlines" | "dispatch" | "reports">(
    "live"
  );

  const fetchEmergencyData = useCallback(async (forceRefresh = false) => {
    try {
      setRefreshing(true);
      const [alertsRes, reportsRes] = await Promise.all([
        emergencyClientService.getAlerts(forceRefresh),
        emergencyClientService.getReports(forceRefresh),
      ]);

      if (alertsRes.success) setData(alertsRes);
      if (reportsRes.success) setReports(reportsRes.reports);
    } catch (e) {
      console.error("Emergency data fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyData(false);
  }, [fetchEmergencyData]);

  // Handle SOS submission
  const handleSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosLocation.trim() || !sosDescription.trim() || sosSubmitting) return;

    setSosSubmitting(true);
    setSosFeedback(null);

    try {
      const res = await emergencyClientService.submitReport({
        type: sosType,
        location_name: sosLocation.trim(),
        description: sosDescription.trim(),
        reporter_name: user?.fullName || "Campus Resident",
      });

      if (res.success) {
        setSosFeedback({ message: res.message, ref: res.report?.public_ref });
        setSosDescription("");
        setSosLocation("");
        fetchEmergencyData(true);
      } else {
        setSosFeedback({ message: res.message || "Failed to transmit SOS report" });
      }
    } catch {
      setSosFeedback({ message: "Network transmission error" });
    } finally {
      setSosSubmitting(false);
    }
  };

  // Handle Safety Check-In
  const handleCheckIn = async (alertId: string, status: "safe" | "need_help") => {
    if (checkInLoading) return;
    setCheckInLoading(alertId);
    try {
      const res = await emergencyClientService.checkIn({
        alert_id: alertId,
        status,
        user_id: user?.institutionalId,
        location_note: "Checked in via CampusGram Portal",
      });

      if (res.success) {
        setCheckedInAlerts((prev) => ({ ...prev, [alertId]: status }));
      }
    } catch {
      // silent
    } finally {
      setCheckInLoading(null);
    }
  };

  // Handle Broadcast Dispatch
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim() || broadcastSubmitting) return;

    setBroadcastSubmitting(true);
    setBroadcastResult(null);

    try {
      const res = await emergencyClientService.broadcastAlert({
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        severity: broadcastSeverity,
        scope: broadcastScope,
        kind: "alert",
        channels: selectedChannels,
        assembly_point: broadcastAssembly.trim() || undefined,
        action_required: broadcastAction.trim() || undefined,
        is_drill: broadcastIsDrill,
      });

      if (res.success) {
        setBroadcastResult(res.message);
        setBroadcastTitle("");
        setBroadcastBody("");
        setBroadcastAction("");
        fetchEmergencyData(true);
        setActiveTab("live");
      } else {
        setBroadcastResult(res.message || "Failed to dispatch broadcast");
      }
    } catch {
      setBroadcastResult("Broadcast transmission failed");
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const toggleChannel = (ch: AlertChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Module 4 Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 font-bold tracking-wider">
                Module 4
              </span>
              <span className="text-xs text-zinc-500 font-mono">Emergency Alert & Life Safety</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <span>Emergency Command Center</span>
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Real-time campus broadcast monitoring, 1-tap SOS rapid reporting, priority dispatch rules, 
              and multi-channel emergency communication network.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("sos")}
              className="apple-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Report SOS</span>
            </button>
            <button
              onClick={() => fetchEmergencyData(true)}
              disabled={refreshing}
              className="apple-press p-2 rounded-lg border border-zinc-800/80 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800/80 text-xs font-medium backdrop-blur-md">
          <button
            onClick={() => setActiveTab("live")}
            className={cn(
              "apple-press px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeTab === "live"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>Active Broadcasts</span>
            {data.active.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold">
                {data.active.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("sos")}
            className={cn(
              "apple-press px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeTab === "sos"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Tap SOS Reporting</span>
          </button>

          <button
            onClick={() => setActiveTab("hotlines")}
            className={cn(
              "apple-press px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeTab === "hotlines"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Campus Hotlines</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={cn(
              "apple-press px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeTab === "reports"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Incident Registry</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {reports.length}
            </span>
          </button>

          {isStaffOrAdmin && (
            <button
              onClick={() => setActiveTab("dispatch")}
              className={cn(
                "apple-press px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 sm:ml-auto",
                activeTab === "dispatch"
                  ? "bg-red-950/80 text-red-200 border border-red-800 font-semibold"
                  : "text-red-400/80 hover:text-red-300 hover:bg-red-950/30"
              )}
            >
              <Megaphone className="w-3.5 h-3.5 text-red-400" />
              <span>Broadcast Console (Admin)</span>
            </button>
          )}
        </div>

        {/* Tab 1: Live Active Broadcasts */}
        {activeTab === "live" && (
          <div className="space-y-4">
            {data.active.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-zinc-200">No active emergency alerts</p>
                <p className="text-xs text-zinc-500">
                  Campus operations are normal. All life-safety systems monitored 24/7.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.active.map((alert) => {
                  const isCritical = alert.severity === "critical";
                  const isWarning = alert.severity === "warning";
                  const checkedStatus = checkedInAlerts[alert.id];

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "rounded-xl border p-5 space-y-4 transition-all",
                        isCritical
                          ? "bg-red-950/30 border-red-800 shadow-md"
                          : isWarning
                          ? "bg-amber-950/20 border-amber-800/80"
                          : "bg-zinc-900/60 border-zinc-800"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border",
                              isCritical
                                ? "bg-red-900 text-red-100 border-red-700"
                                : isWarning
                                ? "bg-amber-900/80 text-amber-200 border-amber-700"
                                : "bg-blue-900/80 text-blue-200 border-blue-700"
                            )}
                          >
                            {alert.is_drill ? "DRILL EXERCISE" : alert.severity.toUpperCase()}
                          </span>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 capitalize">
                            Scope: {alert.scope.replace("_", " ")}
                          </span>

                          {alert.kind === "all_clear" && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                              ALL CLEAR
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {alert.sent_at
                              ? new Date(alert.sent_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h2 className="text-base font-bold text-zinc-100">{alert.title}</h2>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {alert.body}
                        </p>
                      </div>

                      {/* Instructions & Assembly Point */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        {alert.assembly_point && (
                          <div className="flex items-start gap-2 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80">
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-semibold">
                                Designated Evacuation Assembly
                              </p>
                              <p className="text-zinc-200 font-medium">{alert.assembly_point}</p>
                            </div>
                          </div>
                        )}

                        {alert.action_required && (
                          <div className="flex items-start gap-2 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80">
                            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-semibold">
                                Immediate Action Protocol
                              </p>
                              <p className="text-zinc-200 font-medium">{alert.action_required}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Safety Check-in Strip */}
                      <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-zinc-400" />
                          <span className="text-xs font-medium text-zinc-300">
                            Personal Safety Status:
                          </span>
                          {checkedStatus ? (
                            <span
                              className={cn(
                                "text-[11px] font-mono px-2 py-0.5 rounded font-bold border",
                                checkedStatus === "safe"
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                                  : "bg-red-950/80 text-red-300 border-red-800"
                              )}
                            >
                              {checkedStatus === "safe" ? "Marked Safe" : "Assistance Requested"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500">Not checked in</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCheckIn(alert.id, "safe")}
                            disabled={checkInLoading === alert.id || checkedStatus === "safe"}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>I am Safe</span>
                          </button>

                          <button
                            onClick={() => handleCheckIn(alert.id, "need_help")}
                            disabled={checkInLoading === alert.id || checkedStatus === "need_help"}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/80 border border-red-800 text-red-200 hover:bg-red-900/80 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Need Assistance</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 1-Tap SOS Reporting */}
        {activeTab === "sos" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-red-300">
                  Priority 1 Emergency Dispatch
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Use this channel exclusively for active threats, fires, medical trauma, or structural hazards. 
                Reports automatically notify campus security rapid response units within seconds.
              </p>
            </div>

            <form onSubmit={handleSosSubmit} className="space-y-4 bg-zinc-900/60 p-5 rounded-xl border border-zinc-800">
              {/* Type Grid */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Incident Nature <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {EMERGENCY_TYPES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = sosType === item.type;
                    return (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => setSosType(item.type)}
                        className={cn(
                          "p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all text-center",
                          isSelected
                            ? "bg-red-950/80 border-red-600 text-red-200 shadow-sm"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", isSelected ? "text-red-400" : "text-zinc-500")} />
                        <span>{item.label}</span>
                        {item.isP1 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-900/60 text-red-300">
                            P1 Rapid
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Exact Location <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={sosLocation}
                  onChange={(e) => setSosLocation(e.target.value)}
                  placeholder="e.g. Science Complex Lab 304, or Hostel Block B Stairwell"
                  className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Situation Details <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={sosDescription}
                  onChange={(e) => setSosDescription(e.target.value)}
                  placeholder="Describe what happened, any injuries, visible smoke, or immediate dangers..."
                  className="w-full px-3 py-2 border border-zinc-800 rounded-lg resize-none bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-600"
                />
              </div>

              {sosFeedback && (
                <div
                  className={cn(
                    "p-3 rounded-lg border text-xs flex items-center gap-2",
                    sosFeedback.ref
                      ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                      : "bg-red-950/40 border-red-800/60 text-red-200"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sosFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sosSubmitting || !sosLocation.trim() || !sosDescription.trim()}
                className="w-full py-3 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sosSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting SOS Alert...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>DISPATCH IMMEDIATE SOS</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Campus Emergency Hotlines */}
        {activeTab === "hotlines" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.hotlines.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-zinc-700/80 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded font-bold border",
                          contact.category === "Security"
                            ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                            : contact.category === "Medical"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                            : contact.category === "Fire"
                            ? "bg-red-950/80 text-red-300 border-red-800"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        )}
                      >
                        {contact.category.toUpperCase()}
                      </span>

                      <span className="text-[10px] font-mono text-zinc-500">
                        Ext: {contact.ext}
                      </span>
                    </div>

                    <h3 className="font-semibold text-zinc-100 text-sm">{contact.name}</h3>

                    <div className="pt-2 space-y-1 text-xs text-zinc-400">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{contact.location}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{contact.availableHours}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-200">
                      {contact.phone}
                    </span>
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Broadcast Dispatch Console (Admin/Staff only) */}
        {activeTab === "dispatch" && isStaffOrAdmin && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-red-400" />
                  <span>Campus-Wide Alert Dispatch Console</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Draft and simulate multi-channel notification fan-out (SMS, In-App, Push Notifications, Siren).
                </p>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-200">Broadcast Title <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. FLASH STORM WARNING: North Corridor Trees Clearance"
                    className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-200">Alert Message Body <span className="text-red-400">*</span></label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Full advisory or evacuation instruction for campus community..."
                    className="w-full px-3 py-2 border border-zinc-800 rounded-lg resize-none bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Severity */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-200">Severity Tier</label>
                    <select
                      value={broadcastSeverity}
                      onChange={(e) => setBroadcastSeverity(e.target.value as EmergencySeverity)}
                      className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-200 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="advisory">Advisory (Informative, Low Urgency)</option>
                      <option value="warning">Warning (Cautionary Action Required)</option>
                      <option value="critical">Critical (Immediate Evacuation / Danger)</option>
                    </select>
                  </div>

                  {/* Scope */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-200">Target Audience Scope</label>
                    <select
                      value={broadcastScope}
                      onChange={(e) => setBroadcastScope(e.target.value as EmergencyScope)}
                      className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-200 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="campus_wide">Campus-Wide (All Registered Users)</option>
                      <option value="audience">Targeted Building / Department</option>
                      <option value="responders_only">Emergency Responders Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Assembly Point */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-200">Evacuation Assembly Point</label>
                    <input
                      type="text"
                      value={broadcastAssembly}
                      onChange={(e) => setBroadcastAssembly(e.target.value)}
                      placeholder="e.g. Central Sports Field A"
                      className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  {/* Action Required */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-200">Action Instruction</label>
                    <input
                      type="text"
                      value={broadcastAction}
                      onChange={(e) => setBroadcastAction(e.target.value)}
                      placeholder="e.g. Evacuate via West Stairwell immediately"
                      className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>

                {/* Multi-Channel Selection */}
                <div className="space-y-2 pt-1">
                  <label className="font-semibold text-zinc-200">Fan-Out Delivery Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {(["in_app", "push", "sms", "siren"] as AlertChannel[]).map((ch) => {
                      const isSelected = selectedChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => toggleChannel(ch)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-colors",
                            isSelected
                              ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold"
                              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                          )}
                        >
                          {ch.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drill toggle */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="drillToggle"
                    checked={broadcastIsDrill}
                    onChange={(e) => setBroadcastIsDrill(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="drillToggle" className="text-zinc-300 font-medium cursor-pointer select-none">
                    Mark as Training / Routine Drill (appends DRILL badge)
                  </label>
                </div>

                {broadcastResult && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 text-xs font-mono">
                    {broadcastResult}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={broadcastSubmitting}
                  className="w-full py-2.5 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {broadcastSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting to Community...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>TRANSMIT CAMPUS BROADCAST</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: Recent Incident Registry */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-500 space-y-2">
                <Layers className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-xs font-semibold text-zinc-300">No emergency incident logs</p>
                <p className="text-[11px] text-zinc-500">
                  Transmitted SOS reports will be archived here.
                </p>
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded font-bold border",
                          rep.priority === 1
                            ? "bg-red-950/80 text-red-300 border-red-800"
                            : rep.priority === 2
                            ? "bg-amber-950/80 text-amber-300 border-amber-800"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        )}
                      >
                        PRIORITY {rep.priority}
                      </span>

                      <span className="font-mono text-zinc-400 text-[11px]">
                        Ref: {rep.public_ref}
                      </span>

                      <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
                        {rep.type.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(rep.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-200 font-medium leading-relaxed whitespace-pre-wrap">
                    {rep.description}
                  </p>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      <span>{rep.location_name}</span>
                    </div>
                    <div>
                      <span>Status: </span>
                      <strong className="text-zinc-300 uppercase">{rep.status}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
