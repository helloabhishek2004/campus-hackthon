"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@smart-campus/ui";
import type { ComplaintAnalysisResponse } from "@smart-campus/contracts";
import {
  Activity,
  ShieldAlert,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const [complaintText, setComplaintText] = useState(
    "Electric sparks are coming from the switchboard in Room 204 Block B next to the projector.",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplaintAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/complaints/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: `CMP-${Date.now().toString().slice(-4)}`,
          text: complaintText,
          complainant: {
            department: "Computer Science",
            programme: "B.Tech",
            semester: 6,
          },
          metadata: {
            source: "web_portal_test",
          },
        }),
      });

      const data: ComplaintAnalysisResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const getSeverityBadgeVariant = (level?: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "high":
        return "warning";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Smart Campus Monorepo
            </span>
            <Badge variant="success">Foundation Ready</Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Smart Campus Portal
          </h1>
          <p className="text-slate-600 mt-1">
            Independent modular development with shared TypeScript contracts &
            AI intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 py-1 px-3"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            pnpm workspaces
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 py-1 px-3"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Next.js App Router
          </Badge>
        </div>
      </div>

      {/* Architecture Modules Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Module 1
              </span>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle>Campus Portal</CardTitle>
            <CardDescription>
              Feed, communication, complaint creation, role-based dashboards &
              auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <strong>Ownership:</strong>{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              apps/web
            </code>
            <br />
            <strong>Persistence:</strong> Canonical records in Supabase
            PostgreSQL.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                Module 2
              </span>
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <CardTitle>Complaint Intelligence</CardTitle>
            <CardDescription>
              Gemini AI analysis, severity ranking, clustering, and routing
              recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <strong>Ownership:</strong>{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              modules/complaint-intelligence
            </code>
            <br />
            <strong>Modes:</strong> Deterministic Mock + Google Gemini.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Shared Boundary
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <CardTitle>Contracts & UI</CardTitle>
            <CardDescription>
              Single source of truth for runtime Zod validation and TypeScript
              types.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <strong>Packages:</strong>{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              @smart-campus/contracts
            </code>
            ,{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              @smart-campus/ui
            </code>
            .
          </CardContent>
        </Card>
      </div>

      {/* Interactive Verification Widget */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle>Live Integration Verification</CardTitle>
          </div>
          <CardDescription>
            Test the live contract execution between{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">apps/web</code>{" "}
            and{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">
              modules/complaint-intelligence
            </code>{" "}
            via the server route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Grievance / Complaint Description
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[90px]"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Describe campus issue..."
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Provider Mode: <strong>Deterministic Mock or Gemini</strong> (via
              AI_PROVIDER)
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !complaintText.trim()}
            >
              {loading ? "Analyzing..." : "Analyze with Module 2"}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-4 p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">Status:</span>
                  <Badge variant={result.success ? "success" : "destructive"}>
                    {result.processing.status}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    Provider: {result.processing.provider || "mock"} (
                    {result.processing.duration_ms}ms)
                  </span>
                </div>
                {result.analysis && (
                  <Badge
                    variant={getSeverityBadgeVariant(
                      result.analysis.severity.level,
                    )}
                  >
                    Severity: {result.analysis.severity.level.toUpperCase()}{" "}
                    (Score: {result.analysis.severity.score})
                  </Badge>
                )}
              </div>

              {result.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">
                      Classification & Summary
                    </h4>
                    <p className="text-slate-900 font-medium">
                      {result.analysis.title_summary}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {result.analysis.summary}
                    </p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Category: {result.analysis.category}
                      </span>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        Sub: {result.analysis.subcategory}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">
                      Routing & Dispatch
                    </h4>
                    <p className="text-slate-900">
                      <strong>Dept:</strong>{" "}
                      {result.analysis.suggested_recipient.department}
                    </p>
                    {result.analysis.suggested_recipient.role && (
                      <p className="text-slate-600 text-xs">
                        <strong>Role:</strong>{" "}
                        {result.analysis.suggested_recipient.role}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      {result.analysis.suggested_recipient.reasoning}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">
                      Extracted Location
                    </h4>
                    <p className="text-xs text-slate-600">
                      Building:{" "}
                      <strong>
                        {result.analysis.location.building || "N/A"}
                      </strong>{" "}
                      | Room:{" "}
                      <strong>{result.analysis.location.room || "N/A"}</strong>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">
                      Duplicate & Cluster Check
                    </h4>
                    <p className="text-xs text-slate-600">
                      Duplicate:{" "}
                      <strong>
                        {result.analysis.cluster_match?.is_potential_duplicate
                          ? "Yes"
                          : "No"}
                      </strong>{" "}
                      (Similar issues found:{" "}
                      {result.analysis.cluster_match?.similar_issues.length ||
                        0}
                      )
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
