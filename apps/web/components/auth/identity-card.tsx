import React from "react";
import { InstitutionalLookupResponse, InstitutionalTag } from "@smart-campus/contracts";
import { Avatar } from "../ui/avatar";
import { Badge } from "@smart-campus/ui";
import {
  Building2,
  GraduationCap,
  Briefcase,
  Phone,
  ShieldCheck,
  Tag,
  Hash,
  BookOpen,
} from "lucide-react";
import { cn } from "@smart-campus/utils";

interface IdentityCardProps {
  profile: InstitutionalLookupResponse;
  className?: string;
  variant?: "verification" | "profile";
  footerAction?: React.ReactNode;
}

export function IdentityCard({
  profile,
  className,
  variant = "verification",
  footerAction,
}: IdentityCardProps) {
  const isStudent = profile.role === "student";
  const isFaculty = profile.role === "faculty";
  const isAdmin = profile.role === "admin";

  const roleBadgeVariant = () => {
    switch (profile.role) {
      case "student":
        return "success";
      case "faculty":
        return "default";
      case "admin":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatTagLabel = (tag: InstitutionalTag) => {
    return tag.replace(/_/g, " ");
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8 shadow-2xl backdrop-blur-md overflow-hidden",
        className
      )}
    >
      {/* Decorative subtle ambient backdrop glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Verification Header */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-800/80">
        <div className="relative mb-3">
          <Avatar
            name={profile.fullName}
            role={profile.role}
            size={variant === "profile" ? "xl" : "lg"}
          />
          <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-1 border border-zinc-800 shadow">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
          {profile.fullName}
        </h3>

        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <span className="font-mono text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
            {profile.institutionalId}
          </span>
          <Badge variant={roleBadgeVariant()} className="capitalize tracking-wide font-medium">
            {profile.role}
          </Badge>
          {profile.isActive && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified Record
            </span>
          )}
        </div>
      </div>

      {/* Identity Details Grid */}
      <div className="py-6 space-y-4 text-sm">
        {/* Department */}
        <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-400">
            <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Department</span>
          </div>
          <div className="text-right font-medium text-zinc-200">
            {profile.departmentName || profile.departmentCode || "Institutional Core"}
          </div>
        </div>

        {/* Student Specific Fields */}
        {isStudent && (
          <>
            {profile.programName && (
              <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-400">
                  <GraduationCap className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Program</span>
                </div>
                <div className="text-right font-medium text-zinc-200 max-w-[60%]">
                  {profile.programName}
                </div>
              </div>
            )}

            {(profile.academicYear || profile.semester) && (
              <div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-400">
                  <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Academic Level</span>
                </div>
                <div className="text-right font-medium text-zinc-200">
                  {profile.academicYear ? `Year ${profile.academicYear}` : ""}
                  {profile.semester ? ` (Sem ${profile.semester})` : ""}
                  {profile.section ? ` • Sec ${profile.section}` : ""}
                </div>
              </div>
            )}
          </>
        )}

        {/* Faculty / Staff Specific Fields */}
        {(isFaculty || isAdmin) && profile.designation && (
          <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800/50">
            <div className="flex items-center gap-2 text-zinc-400">
              <Briefcase className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Designation</span>
            </div>
            <div className="text-right font-medium text-zinc-200">
              {profile.designation}
            </div>
          </div>
        )}

        {/* Masked Contact Phone (Strict Privacy) */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-400">
            <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Registered Phone</span>
          </div>
          <div className="font-mono text-zinc-300 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800/70 text-xs">
            {profile.maskedPhone}
          </div>
        </div>

        {/* Responsibility Tags (if present) */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="py-2 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Institutional Responsibilities</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs bg-blue-950/60 border border-blue-800/50 text-blue-300 px-2.5 py-1 rounded-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {formatTagLabel(tag)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Action slot */}
      {footerAction && <div className="pt-4 border-t border-zinc-800/80">{footerAction}</div>}
    </div>
  );
}
