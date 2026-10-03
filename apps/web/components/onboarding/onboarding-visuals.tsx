import React from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  KeyRound,
  MapPin,
} from "lucide-react";

function DoodleFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="onboarding-visual relative mx-auto flex h-[18rem] w-full max-w-2xl items-center justify-center overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_80px_-36px_rgba(0,0,0,0.25)] dark:border-zinc-800 dark:bg-zinc-900 sm:h-[22rem] lg:h-[28rem]">
      <div className="onboarding-orb onboarding-orb-one" />
      <div className="onboarding-orb onboarding-orb-two" />
      <div className="onboarding-grid absolute inset-0 opacity-50" />
      {children}
    </div>
  );
}

const lineStrong = "h-2 rounded-full bg-zinc-800/80 dark:bg-zinc-200/80";
const lineSoft = "h-1.5 rounded-full bg-zinc-400/60 dark:bg-zinc-500/60";

export function CampusInfoVisual() {
  return (
    <DoodleFrame>
      <div className="onboarding-doodle onboarding-drift relative z-10 w-[72%] max-w-sm rotate-[-4deg] rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-2xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-950 sm:p-5">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
              <Bell className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <div className={`${lineStrong} w-24`} />
              <div className={`${lineSoft} w-16`} />
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-zinc-500" />
        </div>
        <div className="space-y-2.5 py-5">
          <div className={`${lineStrong} w-[82%]`} />
          <div className={`${lineSoft} w-[64%]`} />
          <div className={`${lineSoft} w-[48%] opacity-70`} />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 dark:bg-zinc-300" /> Official campus signal
        </div>
      </div>
      <div className="onboarding-spark absolute right-[13%] top-[18%] text-zinc-500">✦</div>
      <div className="onboarding-spark absolute bottom-[18%] left-[14%] text-zinc-400">✧</div>
    </DoodleFrame>
  );
}

export function ComplaintsVisual() {
  return (
    <DoodleFrame>
      <div className="onboarding-doodle onboarding-drift relative z-10 w-[72%] max-w-sm rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-2xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-950 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <div className={`${lineStrong} w-28`} />
            <div className={`${lineSoft} w-20`} />
          </div>
        </div>
        <div className="relative my-8 flex items-center justify-between">
          <div className="absolute left-3 right-3 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800"><div className="h-full w-2/3 rounded-full bg-zinc-700 dark:bg-zinc-300" /></div>
          {["Submitted", "Routed", "Resolved"].map((label, index) => (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border-4 border-zinc-50 text-zinc-100 dark:border-zinc-950 dark:text-zinc-900 ${index < 2 ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                {index < 2 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
              </span>
              <span className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-zinc-200/70 px-3 py-2 text-[10px] text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
          <span>One clear status trail</span><ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="onboarding-spark absolute right-[14%] top-[20%] text-zinc-500">✦</div>
    </DoodleFrame>
  );
}

export function LostFoundVisual() {
  return (
    <DoodleFrame>
      <div className="onboarding-doodle onboarding-drift relative z-10 flex w-[72%] max-w-sm flex-col items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-2xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-950 sm:p-7">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200">
          <div className="absolute inset-3 rounded-[1.5rem] border border-dashed border-zinc-400 dark:border-zinc-500" />
          <KeyRound className="h-10 w-10" />
          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-zinc-100 shadow-lg dark:bg-zinc-100 dark:text-zinc-900"><CheckCircle2 className="h-4 w-4" /></span>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300"><MapPin className="h-3.5 w-3.5" /> Safe, verified handover</div>
        <div className="mt-2 h-1.5 w-28 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>
      <div className="onboarding-spark absolute bottom-[18%] right-[15%] text-zinc-500">✧</div>
    </DoodleFrame>
  );
}
