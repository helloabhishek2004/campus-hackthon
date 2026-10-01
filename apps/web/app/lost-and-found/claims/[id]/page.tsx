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
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found/my-reports"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Reports
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Claim Review: {id}</CardTitle>
            <Badge variant="outline">Verification Workflow</Badge>
          </div>
          <CardDescription>
            Claimant answers, verification checks, decision controls, and
            handover window release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center text-slate-500 border border-dashed rounded-lg flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-slate-400" />
            <p className="text-sm">
              Claim status tracker and verification dialogue will render here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
