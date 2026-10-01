import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@smart-campus/ui";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function LostFoundAdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lost & Found
      </Link>

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Custody & Admin Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            For Security Officers & Administrators to oversee items, handovers,
            and audit logs.
          </p>
        </div>
        <Badge variant="destructive">Authorized Staff Only</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-base">
              Campus Security Intake & Custody
            </CardTitle>
          </div>
          <CardDescription>
            Log high-value items turned in to the main security post or
            department desks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
            Custody management tables, physical storage location assignments,
            and contact reveal audit logs will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
