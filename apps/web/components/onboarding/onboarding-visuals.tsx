import React from "react";
import {
  Bell,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Search,
  Key,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";

export function CampusInfoVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-64 flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Department of CSE</p>
              <p className="text-[10px] text-zinc-500">Official Notice • 10m ago</p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-950/80 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded-full font-medium">
            Live
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-100">
            Hackathon Final Schedule Released
          </h4>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
            Campus teams report to Innovation Hub Block B by 09:30 AM with institutional credentials.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-600" /> Today
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Broadcast
          </span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-2 -right-2 bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs text-zinc-200 backdrop-blur-md">
        <Bell className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
        <span className="font-medium">All Campus Updates</span>
      </div>
    </div>
  );
}

export function ComplaintsVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-64 flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-amber-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Grievance #CMP-2026</p>
              <p className="text-[10px] text-zinc-500">Lab 204 • Block B</p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded-full font-medium">
            In Progress
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">AI Priority Score</span>
            <span className="text-emerald-400 font-semibold">High • Expedited</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full w-4/5" />
          </div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Routed to
          </span>
          <span className="text-zinc-200 font-medium">Electrical Maintenance</span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-2 -left-2 bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs text-zinc-200 backdrop-blur-md">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium">Tracked to Resolution</span>
      </div>
    </div>
  );
}

export function LostFoundVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-64 flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-purple-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Lost Keyring with Blue Tag</p>
              <p className="text-[10px] text-zinc-500">Reported at Central Library</p>
            </div>
          </div>
          <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded-full font-medium">
            Match Found
          </span>
        </div>

        <div className="bg-zinc-950/80 border border-purple-900/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 text-xs font-bold">
              AI
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">94% Confidence Match</p>
              <p className="text-[10px] text-zinc-500">Item in Security Custody</p>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-zinc-500" /> Gate 1 Guard Post
          </span>
          <span className="text-purple-400 font-medium">Verified Handover</span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-2 -left-2 bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs text-zinc-200 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="font-medium">Secure Return</span>
      </div>
    </div>
  );
}
