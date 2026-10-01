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
import { ArrowLeft, Clock } from "lucide-react";

export default function MyReportsPage() {
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
            My Reports & Claims
          </h1>
          <p className="text-sm text-slate-600">
            Track grievances, match suggestions, and active handovers.
          </p>
        </div>
        <Badge variant="outline">User Dashboard</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-base">Active Items & Matches</CardTitle>
          </div>
          <CardDescription>
            High/Medium similarity match alerts with one-click claim initiation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
            User-specific items and matched candidate cards will be listed here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
