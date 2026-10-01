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
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function ReportFoundItemPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lost & Found
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Report a Found Item</CardTitle>
            <Badge variant="outline">Skeleton Placeholder</Badge>
          </div>
          <CardDescription>
            Report an unattended or found article to help reunite it with its
            rightful owner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold">Verification & Custody Boundary</p>
              <p className="text-xs mt-1">
                Found items accept private verification details (hidden from
                public browse) and handover preferences (security desk vs
                direct).
              </p>
            </div>
          </div>
          <Button disabled className="w-full">
            Submit Found Report (Awaiting Implementation)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
