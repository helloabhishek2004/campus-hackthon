import React from "react";
import {
  Bell,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  Clock,
  MapPin,
  FileText,
  Layers,
} from "lucide-react";

export function CampusInfoVisual() {
  return (
    <div className="w-full max-w-sm mx-auto h-56 flex flex-col justify-center select-none">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-3 shadow-lg">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Department Circular</p>
              <p className="text-[10px] text-zinc-500 font-mono">Academic Affairs • Today</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded">
            Official
          </span>
        </div>

        {/* Bulletin Body */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-zinc-100">
            End-Semester Academic Schedule Released
          </h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
            Course registrations, evaluation timelines, and grade card publication schedules are now finalized.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" /> 10:30 AM
          </span>
          <span className="text-emerald-400">Institutional Feed</span>
        </div>
      </div>
    </div>
  );
}

export function ComplaintsVisual() {
  return (
    <div className="w-full max-w-sm mx-auto h-56 flex flex-col justify-center select-none">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-3 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Grievance #CMP-2026-0814</p>
              <p className="text-[10px] text-zinc-500 font-mono">Block B • Lab 204</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded">
            Tracked
          </span>
        </div>

        {/* Linear Step Progression */}
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Routing: Electrical Maintenance</span>
            <span className="text-emerald-400">In Progress</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <div className="h-1 rounded bg-zinc-400" title="Submitted" />
            <div className="h-1 rounded bg-zinc-400" title="Classified" />
            <div className="h-1 rounded bg-zinc-400" title="Dispatched" />
            <div className="h-1 rounded bg-zinc-800" title="Resolved" />
          </div>
        </div>

        {/* Routed Detail */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[11px] flex items-center justify-between">
          <span className="text-zinc-500">Assigned Desk</span>
          <span className="text-zinc-300 font-medium">Campus Works & Services</span>
        </div>
      </div>
    </div>
  );
}

export function LostFoundVisual() {
  return (
    <div className="w-full max-w-sm mx-auto h-56 flex flex-col justify-center select-none">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-3 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Key className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Item Record #LF-8841</p>
              <p className="text-[10px] text-zinc-500 font-mono">Central Library Floor 2</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-zinc-950 text-emerald-400 border border-zinc-800 px-2 py-0.5 rounded">
            In Custody
          </span>
        </div>

        {/* Item Details */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-200">
            Black Backpack with Scientific Calculator
          </p>
          <p className="text-[11px] text-zinc-400">
            Deposited at Security Desk Gate 1. Verified ownership claim required for return.
          </p>
        </div>

        {/* Custody Banner */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-zinc-400" /> Verified Custody
          </span>
          <span className="text-zinc-300">Security Gate 1</span>
        </div>
      </div>
    </div>
  );
}
