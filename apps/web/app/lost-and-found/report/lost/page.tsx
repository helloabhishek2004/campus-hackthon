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

export default function ReportLostItemPage() {
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
            <CardTitle>Report a Lost Item</CardTitle>
            <Badge variant="outline">Skeleton Placeholder</Badge>
          </div>
          <CardDescription>
            Submit details and images of an item you lost on campus to initiate
            automated multimodal matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Feature Boundary Placeholder</p>
              <p className="text-xs mt-1">
                Form inputs for title, category, event date, campus location,
                photos, and private distinguishing marks will be rendered here
                by Developer C.
              </p>
            </div>
          </div>
          <Button disabled className="w-full">
            Submit Lost Report (Awaiting Implementation)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
