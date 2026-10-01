"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileSummary } from "@/components/profile/profile-summary";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="py-2">
        <ProfileSummary />
      </div>
    </AppShell>
  );
}
