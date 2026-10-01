import React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@smart-campus/ui";
import {
  Search,
  PlusCircle,
  ShieldAlert,
  Archive,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function LostAndFoundDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Module 3
            </span>
            <Badge variant="outline">Feature Boundary Skeleton</Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Lost & Found Portal
          </h1>
          <p className="text-slate-600 mt-1">
            Multimodal AI matching, verified ownership claims, and secure campus
            handovers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/lost-and-found/report/lost">
            <Button variant="default">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Report Lost Item
            </Button>
          </Link>
          <Link href="/lost-and-found/report/found">
            <Button variant="secondary">
              <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
              Report Found Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-purple-300 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Browse Directory</CardTitle>
              <Search className="w-4 h-4 text-purple-600" />
            </div>
            <CardDescription>
              Search public catalog of items reported across campus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/lost-and-found/browse">
              <Button variant="outline" size="sm" className="w-full">
                Open Catalog
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-300 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Reports</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <CardDescription>
              Track status, potential match alerts, and active claims.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/lost-and-found/my-reports">
              <Button variant="outline" size="sm" className="w-full">
                View My Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-300 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Custody & Admin</CardTitle>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <CardDescription>
              Security officer dispatch, custody logging, and audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/lost-and-found/admin">
              <Button variant="outline" size="sm" className="w-full">
                Staff Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Notice */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 text-sm text-slate-700">
        <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
          <Archive className="w-4 h-4 text-purple-600" />
          Module 3 Developer Boundary
        </h4>
        <p>
          This dashboard establishes the frontend entry point for Developer C.
          Backend API routes reside under{" "}
          <code className="bg-white px-1.5 py-0.5 rounded border text-xs">
            /api/lost-found/*
          </code>
          , matching logic in{" "}
          <code className="bg-white px-1.5 py-0.5 rounded border text-xs">
            modules/lost-and-found
          </code>
          , and background jobs in{" "}
          <code className="bg-white px-1.5 py-0.5 rounded border text-xs">
            workers/lost-found-worker
          </code>
          .
        </p>
      </div>
    </div>
  );
}
